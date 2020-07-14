// Copyright 2020 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/*
 * Options:
 * msg.payload
 * msg.gcp.projectId
 * msg.gcp.region
 * msg.gcp.registryId
 * msg.gcp.deviceId
 */

/* jshint esversion: 8 */
module.exports = function(RED) {
    "use strict";

    const jwtExpMinutes = 24*60; // How long (in minutes) before the JWT token expires.
    const iot = require('@google-cloud/iot');
    const jwt  = require('jsonwebtoken');
    const mqtt = require("mqtt");
    const axios = require("axios");
    //const utils = require('./utils.js');


    function GoogleCloudIoTTelemetrySendNode(config) {
        RED.nodes.createNode(this, config);

        // When making a request to send a command to a device, the API requires the following values:
        let projectId  = null;
        let region     = null;
        let registryId = null;
        let deviceId   = null;
		let subfolder  = null;
        let privateKey = null;

        let jwtRefreshTimeout = null;

        const STATUS_CONNECTED = {
            fill:  "green",
            shape: "dot",
            text:  "connected"
        };

        const STATUS_DISCONNECTED = {
            fill:  "red",
            shape: "dot",
            text:  "disconnected"
        };

        /*
        const STATUS_CONNECTING = {
            fill:  "yellow",
            shape: "dot",
            text:  "connecting"
        };
        */

        let mqttClient;  // The object representing the MQTT client.



        const node = this;

        // The following may be null values if not configured.
        projectId  = config.projectId;
        region     = config.region;
        registryId = config.registryId;
        deviceId   = config.deviceId;
		subfolder  = config.subfolder;
        //debugger;
        //let xxx = RED.nodes.getNode(config.privateKey);
        privateKey = RED.nodes.getNode(config.privateKey).credentials.privateKey;
        const transport = config.transport;  // Will be either MQTT or HTTP

        node.debug(`transport: ${transport}`);
        //node.debug(`privateKey: ${privateKey}`);


        // Disconnect from MQTT.
        function mqttDisconnect() {
            // If we have a jwtRefreshTimeout timer active then cancel it from firing.
            if (!jwtRefreshTimeout) {
                clearTimeout(jwtRefreshTimeout);
                jwtRefreshTimeout = null;
            }

            // If we have an mqttClient, disconnect it.
            if (mqttClient) {
                mqttClient.end();
                mqttClient = null;
            }

            node.status(STATUS_DISCONNECTED);
        } // mqttDisconnect


        // Transmit a telemetry message to GCP IoT Core over MQTT.
        function transmitMQTT(payload) {
            if (!mqttClient) {
                node.debug("No usable MQTT Client");
                return;
            }
            // https://github.com/mqttjs/MQTT.js#publish

			let finalUrl = `/devices/${deviceId}/events`;
			if(subfolder){
				finalUrl = finalUrl+`/${subfolder}`;
			}

            //mqttClient.publish(`/devices/${deviceId}/events`, payload, { "qos": 1 }, (err) => {
				mqttClient.publish(finalUrl, payload, { "qos": 1 }, (err) => {
                if (err) {
                    node.debug(`Publish error: ${err}`);
                }
            });
        } // transmitMQTT


        // Transmit a telemetry message to GCP IoT Core over HTTP.
        async function transmitHTTP(payload) {
            // payload is a Buffer object.
            // We will use Axios to send an HTTP request
            node.debug(">> transmitHTTP");
            const url = `https://cloudiotdevice.googleapis.com/v1/projects/${projectId}/locations/${region}/registries/${registryId}/devices/${deviceId}:publishEvent`;
            //node.debug(`Url: ${url}`);
            try {
                const resp = await axios({
                    method: "post",
                    "url": url,
                    headers: {
                        "cache-control": "no-cache",
                        "content-type": "application/json",
                        "authorization": `Bearer ${createJwt(projectId, privateKey, "RS256")}`
                    },
                    data: {
                        "binaryData": payload.toString("base64")
                    }
                });
                if (resp.status != 200) {
                    node.debug(JSON.stringify(resp));
                }
            } catch (exp) {
                node.debug(exp);
            }

            node.debug("<< transmitHTTP");
        } // transmitHTTP


        // Called to send a command to the device.
        async function OnInput(msg) {
            // We have been called to send a telemetry message to GCP IoT. 
            if (transport === "MQTT") {
                node.debug(`Sending a telemetry message from device over MQTT`);
                transmitMQTT(RED.util.ensureBuffer(msg.payload));  // The body of the data is in msg.payload
            }
            else if (transport === "HTTP") {
                node.debug(`Sending a telemetry message from device over HTTP`);
                await transmitHTTP(RED.util.ensureBuffer(msg.payload));  // The body of the data is in msg.payload
            }
            node.send(msg);
        } // OnInput


        // Called when the node is closed.  Here we want to disconnect the MQTT client if it is set.
        function OnClose() {
            if (transport === "MQTT") {  // If the transport is MQTT the close the connection.
                mqttDisconnect();
            }
            // There is nothing needed to be done for a transport of HTTP.
        } // OnClose


        // Perform a connection to the MQTT bridge hosted by GCP.
        function mqttConnnect() {
            node.debug(">> mqttConnect");
            mqttDisconnect(); // If we are already connected, disconnect.

            // Form the MQTT connection to the IoT Core Bridge
            const clientId = `projects/${projectId}/locations/${region}/registries/${registryId}/devices/${deviceId}`;
            const connectionArgs = {
                "host": "mqtt.googleapis.com",
                "port": 8883,
                "clientId": clientId,
                "username": "unused",
                "password": createJwt(projectId, privateKey, "RS256"),
                "protocol": 'mqtts',
                "protocolVersion": 4,
                "clean": true,
                "rejectUnauthorized": false
            };

            node.debug(`ClientId: ${clientId}`);
            mqttClient = mqtt.connect(connectionArgs);  // Connect to the MQTT bridge
            mqttClient.on("connect", (success) => {
                node.status(STATUS_CONNECTED);
                node.debug(`MQTT Connected: ${success}`);

                // The connection has succeeded but the JWT token will expire after a period of time.  We setup a time
                // that will fire before the expiration which will form a new connection.
                const interval = (jwtExpMinutes-1)*60*1000;
                jwtRefreshTimeout = setTimeout(function() {
                    node.debug(">> Refresh JWT");
                    mqttConnnect();
                    node.debug("<< Refresh JWT");
                }, interval);
                node.debug(`Refresh in ${interval} msecs`);
            });
            mqttClient.on("error", (err) => {
                node.debug(`MQTT Error: ${err}`);
                mqttDisconnect();
            });
            node.debug("<< mqttConnect");
        } // mqttConnnect


        function createJwt(projectId, privateKey, algorithm) {
            //node.log(`Creating JWT: projectId=${projectId}, algorithm=${algorithm}, privateKey=${privateKey}`);
            const token = {
                iat: parseInt(Date.now() / 1000),
                exp: parseInt(Date.now() / 1000) + jwtExpMinutes * 60,
                aud: projectId,
            };
            const jwtResult = jwt.sign(token, privateKey, { algorithm: algorithm });
            //node.log(`<< Creating JWT`);
            return jwtResult;
        } // createJwt


        // Form the MQTT connection to the IoT Core Bridge
        if (transport === "MQTT") {
            node.status(STATUS_DISCONNECTED);
            mqttConnnect();
        }
        // If the transport is HTTP, nothing need be done.
        node.on('close', OnClose);
        node.on('input', OnInput);

    } // GoogleCloudIoTTelemetrySendNode

    RED.nodes.registerType("google-cloud-iot telemetry-send", GoogleCloudIoTTelemetrySendNode);
};
