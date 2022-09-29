const axios = require("axios");
const jwt = require('jsonwebtoken');
const mqtt = require("mqtt");

class IotUtils {

    //Map of device/mqqtClient
    connectionPool = null;
    //Map of device/config
    paramPool = null;
    //Map of device/timeout function
    jwtRefreshTimeoutPool = null;
    // How long (in minutes) before the JWT token expires
    jwtExpMinutes = 24 * 60; 
    

    constructor() {
        this.connectionPool = new Map();
        this.paramPool = new Map();
        this.jwtRefreshTimeoutPool = new Map();
    }

    mqttConnect(config, RED) {

        console.log("New connect for "+config.deviceId);
        this.mqttDisconnect(config.deviceId); // If we are already connected, disconnect.

        //******************* SET CONFIG PARAMETERS
        let projectId = config.projectId;
        let region = config.region;
        let registryId = config.registryId;
        let deviceId = config.deviceId;
       // let subfolder = config.subfolder;
        let nodePKey = RED.nodes.getNode(config.privateKey);
        let privateKey = null;

        if (null != nodePKey)
            privateKey = nodePKey.credentials.privateKey;

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
            "rejectUnauthorized": false,
            "keepalive": parseInt(config.keepalive),
            "reconnectPeriod":1000,
            "reschedulePings": true,
            "connectTimeout": 30000
        };

        let mqttClient = mqtt.connect(connectionArgs);  // Connect to the MQTT bridge

        mqttClient.on("connect", (success) => {

            //*********** Subscriptions to the config and commands topics in order to keep an operational bidirectional communication
            //*********** Subscriptions need to be subscribded with qos 1
            mqttClient.subscribe(`/devices/${deviceId}/config`, { qos: 1 });
            mqttClient.subscribe(`/devices/${deviceId}/commands/#`, { qos: 1 });

            // The connection has succeeded but the JWT token will expire after a period of time.  We setup a time
            // that will fire before the expiration which will form a new connection.
            const interval = (this.jwtExpMinutes - 1) * 60 * 1000;

            let self = this;

            //delete existing Timeout fonction, if any
            let existing = this.jwtRefreshTimeoutPool.get(deviceId);
            if (null!=existing) {
                console.log("On connect - Deleting timeout function for "+deviceId);
                clearTimeout(existing);
                existing = null;
                this.jwtRefreshTimeoutPool.delete(deviceId);
            }

            //create new Timeout fonction for the new client
            let jwtRefreshTimeout = setTimeout(function () {
                console.log(Math.round(new Date().getTime() / 1000) + " - Reconnect & refresh connection, after JWT expiration !")
                self.reconnect(deviceId, RED);
            }, interval);
                        
            //keep the client for reuse
            this.connectionPool.set(deviceId, mqttClient);
            this.paramPool.set(deviceId, config);
            this.jwtRefreshTimeoutPool.set(deviceId,jwtRefreshTimeout);

        }, (err) => {
            console.log("Error on connect ");
            console.log(err);
        });

        mqttClient.on("error", (err) => {
            console.log("**************************");
            console.log(Math.round(new Date().getTime() / 1000) + " - error in node : " + config.name + " !");
            console.log(err);
            this.reconnect(deviceId, RED);
            console.log("**************************");

        });

        return mqttClient;
    }

    // Disconnect from MQTT.
    mqttDisconnect(deviceId) {

        let mqttClient = this.connectionPool.get(deviceId);

        //delete existing Timeout function, if any for the client
        let existing = this.jwtRefreshTimeoutPool.get(deviceId);
        if (null!=existing) {
            console.log("Disconnect - Deleting timeout function for "+deviceId);
            clearTimeout(existing);
            existing = null;
            this.jwtRefreshTimeoutPool.delete(deviceId);
        }

        // If we have an mqttClient, disconnect it.
        if (mqttClient) {
            mqttClient.end();
            mqttClient = null;
            this.connectionPool.delete(deviceId);
            //this.paramPool.delete(deviceId);
        }

    } // mqttDisconnect

    createJwt(projectId, privateKey, algorithm) {
        //node.log(`Creating JWT: projectId=${projectId}, algorithm=${algorithm}, privateKey=${privateKey}`);
        const token = {
            iat: parseInt(Date.now() / 1000),
            exp: parseInt(Date.now() / 1000) + this.jwtExpMinutes * 60,
            aud: projectId,
        };

        //this is needed in case of the credentials of the node are empty (crash of node-red...)
        let jwtResult = "init";
        if (null != privateKey)
            jwtResult = jwt.sign(token, privateKey, { algorithm: algorithm });
        //node.log(`<< Creating JWT`);

        return jwtResult;
    } // createJwt


    reconnect(deviceId, RED) {

        let config = this.paramPool.get(deviceId);
        let self = this;

        const disconnectionPromise = new Promise((resolve, reject) => {
            resolve(self.mqttDisconnect(deviceId));
        });

        disconnectionPromise.then(() => {

            self.mqttConnect(config, RED);

        });
    }

    // Transmit a telemetry message to GCP IoT Core over MQTT.
    transmitMQTT(payload, deviceId, topic) {

        let mqttClient = this.connectionPool.get(deviceId);
        let config = this.paramPool.get(deviceId);

        // https://github.com/mqttjs/MQTT.js#publish

        let finalUrl = '/devices/'+deviceId+'/events';
        
        /*
        if (config.subfolder) {
            finalUrl = finalUrl + `/${config.subfolder}`;
        }
        */
        if (topic) {
            finalUrl = finalUrl + '/'+topic;
        }

        //mqttClient.publish(`/devices/${deviceId}/events`, payload, { "qos": 1 }, (err) => {
        mqttClient.publish(finalUrl, payload, { "qos": config.qos }, (err) => {
            if (err) {
                console.log(`Publish error: ${err}`);
                console.log("payload:" + payload);
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