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
 * This node provides DLP processing.  We will assume that msg.payload
 * contains the original data that may contain sensistive data.
 * 
 * The configuration for the node includes:
 *
 * projectId - The project against which the DLP processing should be billed.
 * inspectTemplateName - The name of a template defined in GCP console.
 *
 */
/* jshint esversion: 8 */
module.exports = function(RED) {
    "use strict";
    const NODE_TYPE = "google-cloud-dlp";
    const DLP = require('@google-cloud/dlp');
    let dlpServiceClient;

    function DLPNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        const inspectTemplateName = config.inspectTemplateName;  // The name of the inspection template to use.
        const projectId = config.projectId;

        let credentials = null;
        if (config.account) {
            credentials = GetCredentials(config.account);
        }
        const keyFilename = config.keyFilename;

        /**
         * Extract JSON service account key from "google-cloud-credentials" config node.
         */
        
        function GetCredentials(node) {
            return JSON.parse(RED.nodes.getCredentials(node).account);
        }

        // Called when a message arrives at the node.
        async function Input(msg) {
            const item = {
                value: msg.payload
            };
            const request = {
                "parent":              dlpServiceClient.projectPath(projectId),
                "inspectTemplateName": dlpServiceClient.projectInspectTemplatePath(projectId, inspectTemplateName),
                "deidentifyConfig": {
                    "infoTypeTransformations": {
                        transformations: [
                            {
                                infoTypes: [],
                                primitiveTransformation: {
                                    replaceWithInfoTypeConfig: {
                                    }
                                }
                            }
                        ]
                    }
                },
                "item": item
            };

            // Invoke the DLP API to perform the processing.
            try {
                const dlpResponseArray = await dlpServiceClient.deidentifyContent(request);
                msg.payload = dlpResponseArray[0];
                node.send(msg);
            }
            catch(e) {
                if (e.details) {
                    node.error(e.details);
                } else {
                    console.log(e);
                }
            }
        } // Input


        // We must have EITHER credentials or a keyFilename.  If neither are supplied, that
        // is an error.  If both are supplied, then credentials will be used.
        if (credentials) {
            dlpServiceClient = new DLP.DlpServiceClient({
                "credentials": credentials
            });
        } else if (keyFilename) {
            dlpServiceClient = new DLP.DlpServiceClient({
                "keyFilename": keyFilename
            });
        } else {
            node.error('Missing credentials or keyFilename.');
            return;
        }

        node.on("input", Input);
    } // DLPNode


    RED.nodes.registerType(NODE_TYPE, DLPNode);
};