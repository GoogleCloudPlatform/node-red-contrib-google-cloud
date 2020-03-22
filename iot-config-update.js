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

    const iot = require('@google-cloud/iot');
    const utils = require('./utils.js');

    /**
     * Extract JSON service account key from "google-cloud-credentials" config node.
     */
    function GetCredentials(node) {
        return JSON.parse(RED.nodes.getCredentials(node).account);
    }


    function GoogleCloudIoTConfigUpdateNode(config) {
        // When making a request to send a command to a device, the API requires the following values:
        let projectId  = null;
        let region     = null;
        let registryId = null;
        let deviceId   = null;

        let iotDeviceManagerClient = null; // The ioT Device Manager Client
        let formattedName = null; // The full identity of the device

        RED.nodes.createNode(this, config);

        const node = this;

        let credentials = null;
        if (config.account) {
            credentials = GetCredentials(config.account);
        }
        const keyFilename = config.keyFilename;

        // The following may be null values if not configured.
        projectId  = config.projectId;
        region     = config.region;
        registryId = config.registryId;
        deviceId   = config.deviceId;

        // Called to send a command to the device.
        async function OnInput(msg) {
            // We have been called to send a command to the IoT device.  We now need to build the
            // parameters to the request.  We need to check quite a few things.

            // Check that we have a good payload to send as the message body.
            if (msg == null || !msg.payload || msg.payload == "") {
                node.log('Nothing to send, msg.payload is empty');
                return;
            }
            if (typeof(msg.payload) === 'number') {
                node.error('msg.payload can\'t be a number');
                return;
            }

            // Check that we have a project id.  We will use msg.gcp.projectId if supplied and the configuration if not.
            let requestProjectId = projectId;
            if (msg.gcp && msg.gcp.projectId != null) {
                requestProjectId = msg.gcp.projectId;
            }
            if (requestProjectId == null || typeof(requestProjectId) != 'string' || requestProjectId.trim().length == 0) {

                // If we still have no project id then this means that none was found either:
                //
                // * msg.gcp.projectId
                // * Static node instance configuration
                //
                // Before we give up, we can try one more thing.  We can assume that we are running in a Compute Engine and
                // ask the metadata about our instance.  Specifically we can perform a REST request to try and retrieve
                // that data.
                projectId = await utils.getProjectId();
                if (projectId == null) {
                    node.error("No project id found");
                    return;
                }
                requestProjectId = projectId;
                return;
            }

            // Check that we have a region.  We will use msg.gcp.region if supplied and the configuration if not.
            let requestRegion = region;
            if (msg.gcp && msg.gcp.region != null) {
                requestRegion = msg.gcp.region;
            }
            if (requestRegion == null || typeof(requestRegion) != 'string' || requestRegion.trim().length == 0) {
                region = await utils.getRegion();
                if (region == null) {
                    node.error("No region found");
                    return;
                }
                requestRegion = region;
            }

            // Check that we have a registry id.  We will use msg.gcp.registryId if supplied and the configuration if not.
            let requestRegistryId = registryId;
            if (msg.gcp && msg.gcp.registryId != null) {
                requestRegistryId = msg.gcp.registryId;
            }
            if (requestRegistryId == null) {
                node.error("No registry id found");
                return;
            }

            // Check that we have a device id.  We will use msg.gcp.deviceId if supplied and the configuration if not.
            let requestDeviceId = deviceId;
            if (msg.gcp && msg.gcp.deviceId != null) {
                requestDeviceId = msg.gcp.deviceId;
            }
            if (requestDeviceId == null) {
                node.error("No device id found");
                return;
            }

            //node.log(`Region: ${requestRegion}, Project Id: ${requestProjectId}`);
            formattedName = iotDeviceManagerClient.devicePath(requestProjectId, requestRegion, requestRegistryId, requestDeviceId);
            //node.log(`Formatted name = ${formattedName}`);

            try {
                const request = {
                    name: formattedName,
                    binaryData: Buffer.from(msg.payload),
                };
                try {
                    const responses = await iotDeviceManagerClient.modifyCloudToDeviceConfig(request);
                } catch (err) {
                    node.error(`Could not update config: ${err}`);
                }
                node.send(msg); // The message has been published so we can forward through the flow.
            }
            catch(e) {
                node.error(`Caught: ${e}`);
            }
        } // OnInput

        function OnClose() {
        } // OnClose

        // We must have EITHER credentials or a keyFilename.  If neither are supplied, that
        // is an error.  If both are supplied, then credentials will be used.
        if (credentials) {
            iotDeviceManagerClient = new iot.v1.DeviceManagerClient({
                "credentials": credentials
            });
        } else if (keyFilename) {
            iotDeviceManagerClient = new iot.v1.DeviceManagerClient({
                "keyFilename": keyFilename
            });
        } else {
            iotDeviceManagerClient = new iot.v1.DeviceManagerClient({});
        }

        node.on('close', OnClose);
        node.on('input', OnInput);
    } // GoogleCloudIoTConfigUpdateNode

    RED.nodes.registerType("google-cloud-iot config-update", GoogleCloudIoTConfigUpdateNode);
};
