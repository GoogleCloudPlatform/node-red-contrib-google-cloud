/**
 * Copyright 2019 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * This node GCE instance operations.  We will assume that msg.payload
 * contains the the configuration required if not present in `config`.
 */

/* jshint esversion: 8 */
module.exports = function (RED) {
    "use strict";
    //const { google } = require('googleapis');
    const compute = require("@google-cloud/compute");

    const NODE_TYPE = "google-cloud-compute-engine-instance";

    function GCEInstanceNode(config) {

        RED.nodes.createNode(this, config);

        // Handle inputs
        const account = config.account;
        const instance = config.instance;
        const keyFilename = config.keyFilename;
        const operation = config.operation;
        const projectId = config.projectId;
        const template = config.template;
        const zone = config.zone;

        const node = this;

        const Input = async (msg, send, done) => {

            // Configure GCE client and credentials

            let computeClient;
            const scopes = [
                'https://www.googleapis.com/auth/cloud-platform',
                'https://www.googleapis.com/auth/compute',
            ]

            let credentials;
            if (account) credentials = JSON.parse(RED.nodes.getCredentials(node).account);

            if (credentials) {
                computeClient = new compute.InstancesClient({
                    "projectId": projectId,
                    "credentials": credentials,
                    "scopes": scopes
                });
            } else if (keyFilename) {
                computeClient = new compute.InstancesClient({
                    "projectId": projectId,
                    "keyFilename": keyFilename,
                    "scopes": scopes
                });
            } else {
                computeClient = new compute.InstancesClient({
                    "projectId": projectId,
                    "scopes": scopes
                });
            }

            // Handle Operation
            try {

                if (operation === "get") {
                    await computeClient
                        .get({
                            instance: instance,
                            project: projectId,
                            zone: zone
                        })
                        .then(response => {
                            msg.payload = response.length ? response[0] : {};
                        });
                }
                else if (operation === "list") {
                    await computeClient
                        .list({
                            project: projectId,
                            zone: zone
                        })
                        .then(response => {
                            msg.payload = response.length ? response[0] : [];
                        });
                }
                else if (operation === "stop") {
                    await computeClient
                        .stop({
                            instance: instance,
                            project: projectId,
                            zone: zone
                        })
                        .then(response => {
                            msg.payload = response.length ? response[0] : {};
                        });
                }
                else if (operation === "start") {
                    await computeClient
                        .start({
                            instance: instance,
                            project: projectId,
                            zone: zone
                        })
                        .then(response => {
                            msg.payload = response.length ? response[0] : {};
                        });
                }
                else if (operation === "reset") {
                    await computeClient
                        .reset({
                            instance: instance,
                            project: projectId,
                            zone: zone
                        })
                        .then(response => {
                            msg.payload = response.length ? response[0] : {};
                        });
                }
                else if (operation === "delete") {
                    await computeClient
                        .start({
                            instance: instance,
                            project: projectId,
                            zone: zone
                        })
                        .then(response => {
                            msg.payload = response.length ? response[0] : {};
                        });
                }
                else if (operation === "create") {
                    await computeClient
                        .insert({
                            project: projectId,
                            zone: zone,
                            instanceResource: template
                        })
                        .then(response => {
                            msg.payload = response.length ? response[0] : {};
                        });
                }

                node.send(msg);

            }
            catch (error) {
                if (done) {
                    done(error);
                } else {
                    node.err(error, msg);
                }
            }
        }

        const Close = () => { };

        node.on("input", Input);
        node.on("close", Close);
    }

    RED.nodes.registerType(NODE_TYPE, GCEInstanceNode);
}