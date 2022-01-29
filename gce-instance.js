/**
 * Copyright 2022 Google Inc.
 * Created by Ari Victor
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
    const compute = require("@google-cloud/compute");
    const NODE_TYPE = "google-cloud-compute-engine-instance";

    function GCEInstanceNode(config) {

        RED.nodes.createNode(this, config);
        const node = this;

        const Input = async (msg, send, done) => {

            // Handle inputs
            const account     = config.account ? config.account : msg.payload.account;
            const instance    = config.instance ? config.instance : msg.payload.instance;
            const keyFilename = config.keyFilename ? config.keyFilename : msg.payload.keyFilename
            const operation   = config.operation ? config.operation : msg.payload.operation
            const projectId   = config.projectId ? config.projectId : msg.payload.projectId
            const template    = config.template ? config.template : msg.payload.template
            const zone        = config.zone ? config.zone : msg.payload.zone

            let credentials;
            if (account) credentials = JSON.parse(RED.nodes.getCredentials(node).account);
            const scopes = [
                'https://www.googleapis.com/auth/cloud-platform',
                'https://www.googleapis.com/auth/compute',
            ]

            let computeClient;
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

            try {
                /* Handle Get Instance */
                if (operation === "get") {
                    node.status({fill:"blue",shape:"dot",text:"getting instance"});
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

                /* Handle List Instances */
                else if (operation === "list") {
                    node.status({fill:"blue",shape:"dot",text:"listing instances"});
                    await computeClient
                        .list({
                            project: projectId,
                            zone: zone
                        })
                        .then(response => {
                            msg.payload = response.length ? response[0] : [];
                        });
                }

                /* Handle Stop Instance */
                else if (operation === "stop") {
                    node.status({fill:"blue",shape:"dot",text:"stopping instance"});
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

                /* Handle Start Instance */
                else if (operation === "start") {
                    node.status({fill:"blue",shape:"dot",text:"starting instance"});
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

                /* Handle Reset Instance */
                else if (operation === "reset") {
                    node.status({fill:"blue",shape:"dot",text:"resetting instance"});
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

                /* Handle Delete Instance */
                else if (operation === "delete") {
                    node.status({fill:"blue",shape:"dot",text:"deleting instance"});
                    await computeClient
                        .delete({
                            instance: instance,
                            project: projectId,
                            zone: zone
                        })
                        .then(response => {
                            msg.payload = response.length ? response[0] : {};
                        });
                }

                /* Handle Create Instance */
                else if (operation === "create") {
                    node.status({fill:"blue",shape:"dot",text:"creating instance"});
                    await computeClient
                        .insert({
                            project: projectId,
                            zone: zone,
                            instanceResource: JSON.parse(template)
                        })
                        .then(response => {
                            msg.payload = response.length ? response[0] : {};
                        });
                }
                node.status({fill:"green",shape:"dot",text:"complete"});
                node.send(msg);
            }
            catch (error) {
                node.status({fill:"red",shape:"dot",text:"error"});
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