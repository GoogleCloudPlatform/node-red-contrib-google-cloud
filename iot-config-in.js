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
module.exports = function (RED) {
    "use strict";

    const jwtExpMinutes = 24 * 60; // How long (in minutes) before the JWT token expires.
    const jwt = require('jsonwebtoken');
    const mqtt = require("mqtt");
    //const utils = require('./utils.js');

    function GoogleCloudIoTConfigIn(config) {
        RED.nodes.createNode(this, config);

        // When making a request to send a command to a device, the API requires the following values:
        let projectId = null;
        let region = null;
        let registryId = null;
        let deviceId = null;
        //let subfolder  = null;
        let privateKey = null;
        let jwtRefreshTimeout = null;

        let qos = null;

        const STATUS_CONNECTED = {
            fill: "green",
            shape: "dot",
            text: "connected"
        };

        const STATUS_DISCONNECTED = {
            fill: "red",
            shape: "dot",
            text: "disconnected"
        };

        let mqttClient;  // The object representing the MQTT client.

        const node = this;

        // The following may be null values if not configured.
        projectId = config.projectId;
        region = config.region;
        registryId = config.registryId;
        deviceId = config.deviceId;
        qos = Number(config.qos || 0);
        //subfolder = config.subfolder;
        //debugger;
        //let xxx = RED.nodes.getNode(config.privateKey);
        privateKey = RED.nodes.getNode(config.privateKey).credentials.privateKey;
        // const transport = config.transport;  // Will be either MQTT or HTTP

        // node.debug(`transport: ${transport}`);
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

        // Called when mqtt message on config topic is received.  Registered with mqttClient.on('message') listener
        function OnMessage(topic, message, packet) {
            if (message === null) {
                return;
            }
            const msg = {
                "payload": message.toString(),    // Save the payload data at msg.payload
                "packet": packet
            }
            if (config.assumeJSON === true) {
                try {
                    msg.payload = JSON.parse(RED.util.ensureString(message));
                }
                catch (err) {
                    // We failed to parse the data ... log an error.
                    node.error(`Failed to parse JSON: ${err}`);
                }
            }
            node.send(msg);
        } //OnMessage

        // Called when the node is closed.  Here we want to disconnect the MQTT client if it is set.
        function OnClose() {
            mqttDisconnect();
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
                const interval = (jwtExpMinutes - 1) * 60 * 1000;
                jwtRefreshTimeout = setTimeout(function () {
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
        node.status(STATUS_DISCONNECTED);
        mqttConnnect();
        mqttClient.subscribe(`/devices/${deviceId}/config`, { qos: qos });
        mqttClient.on('message', OnMessage);
        // If the transport is HTTP, nothing need be done.
        node.on('close', OnClose);

    } // GoogleCloudIoTConfigIn

    RED.nodes.registerType("google-cloud-iot config-in", GoogleCloudIoTConfigIn);
};
