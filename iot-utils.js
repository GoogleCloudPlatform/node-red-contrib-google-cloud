const axios = require("axios");
const jwt = require('jsonwebtoken');
const mqtt = require("mqtt");

class IotUtils {

    //Map of device/mqqtClient
    connectionPool = null;
    paramPool = null;
    jwtExpMinutes = 24 * 60; // How long (in minutes) before the JWT token expires.

    constructor() {
        this.connectionPool = new Map();
        this.paramPool = new Map();
    }

    mqttConnect(config, RED) {

        //let mqttClient = this.connectionPool.get(config.deviceId);
        this.mqttDisconnect(config.deviceId); // If we are already connected, disconnect.

        //******************* SET CONFIG PARAMETERS
        let projectId = config.projectId;
        let region = config.region;
        let registryId = config.registryId;
        let deviceId = config.deviceId;
        let subfolder = config.subfolder;
        let jwtRefreshTimeout = null;

        //let xxx = RED.nodes.getNode(config.privateKey);
        let privateKey = RED.nodes.getNode(config.privateKey).credentials.privateKey;
        let transport = config.transport;  // Will be either MQTT or HTTP

        //******************* END CONFIG PARAMETERS

        // Form the MQTT connection to the IoT Core Bridge
        const clientId = `projects/${projectId}/locations/${region}/registries/${registryId}/devices/${deviceId}`;
        const connectionArgs = {
            "host": "mqtt.googleapis.com",
            "port": 8883,
            "clientId": clientId,
            "username": "unused",
            "password": this.createJwt(projectId, privateKey, "RS256"),
            "protocol": 'mqtts',
            "protocolVersion": 4,
            "clean": true,
            "rejectUnauthorized": false
        };

        let mqttClient = mqtt.connect(connectionArgs);  // Connect to the MQTT bridge

        mqttClient.on("connect", (success) => {

            //*********** Subscriptions to the config and commands topics in order to keep an operational bidirectional communication
            mqttClient.subscribe(`/devices/${deviceId}/config`, { qos: 1 });
            mqttClient.subscribe(`/devices/${deviceId}/commands/#`, { qos: 0 });


            // The connection has succeeded but the JWT token will expire after a period of time.  We setup a time
            // that will fire before the expiration which will form a new connection.
            const interval = (this.jwtExpMinutes - 1) * 60 * 1000;
            
            jwtRefreshTimeout = setTimeout(function () {
                this.mqttConnnect(config);
            }, interval);

            //keep the client for reuse
            this.connectionPool.set(deviceId, mqttClient);
            config.jwtRefreshTimeout = jwtRefreshTimeout;
            config.privateKey = privateKey;
            this.paramPool.set(deviceId, config);

        });

        mqttClient.on("error", (err) => {
            this.mqttDisconnect(deviceId);
        });

        return mqttClient;
    }

    // Disconnect from MQTT.
    mqttDisconnect(deviceId) {

        let mqttClient = this.connectionPool.get(deviceId);
        let config = this.paramPool.get(deviceId);
        let jwtRefreshTimeout = null;

        if (config)
            jwtRefreshTimeout = config.jwtRefreshTimeout;

        // If we have a jwtRefreshTimeout timer active then cancel it from firing.
        if (!jwtRefreshTimeout) {
            clearTimeout(jwtRefreshTimeout);
            jwtRefreshTimeout = null;
        }

        // If we have an mqttClient, disconnect it.
        if (mqttClient) {
            mqttClient.end();
            mqttClient = null;
            this.connectionPool.delete(deviceId);
            this.paramPool.delete(deviceId);
        }


    } // mqttDisconnect

    createJwt(projectId, privateKey, algorithm) {
        //node.log(`Creating JWT: projectId=${projectId}, algorithm=${algorithm}, privateKey=${privateKey}`);
        const token = {
            iat: parseInt(Date.now() / 1000),
            exp: parseInt(Date.now() / 1000) + this.jwtExpMinutes * 60,
            aud: projectId,
        };
        const jwtResult = jwt.sign(token, privateKey, { algorithm: algorithm });
        //node.log(`<< Creating JWT`);
        return jwtResult;
    } // createJwt


    // Transmit a telemetry message to GCP IoT Core over MQTT.
    transmitMQTT(payload, deviceId) {

        let mqttClient = this.connectionPool.get(deviceId);
        let config = this.paramPool.get(deviceId);

        if (!mqttClient || !mqttClient.connected) {
            return;
        }

        // https://github.com/mqttjs/MQTT.js#publish

        let finalUrl = `/devices/${deviceId}/events`;
        if (config.subfolder) {
            finalUrl = finalUrl + `/${config.subfolder}`;
        }

        //mqttClient.publish(`/devices/${deviceId}/events`, payload, { "qos": 1 }, (err) => {
        mqttClient.publish(finalUrl, payload, { "qos": 1 }, (err) => {
            if (err) {
                node.debug(`Publish error: ${err}`);
            }
        });
    } // transmitMQTT


    // Transmit a telemetry message to GCP IoT Core over HTTP.
    async transmitHTTP(payload, deviceId) {

        let config = this.paramPool.get(deviceId);

        // payload is a Buffer object.
        // We will use Axios to send an HTTP request
        node.debug(">> transmitHTTP");
        const url = `https://cloudiotdevice.googleapis.com/v1/projects/${config.projectId}/locations/${config.region}/registries/${config.registryId}/devices/${config.deviceId}:publishEvent`;
        //node.debug(`Url: ${url}`);
        try {
            const resp = await axios({
                method: "post",
                "url": url,
                headers: {
                    "cache-control": "no-cache",
                    "content-type": "application/json",
                    "authorization": `Bearer ${createJwt(config.projectId, config.privateKey, "RS256")}`
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

}

module.exports = {
    IotUtils: IotUtils
}