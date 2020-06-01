/**
 * Copyright 2020 Google Inc.
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
 */
/* jshint esversion: 8 */
module.exports = function(RED) {
    "use strict";

    const NODE_TYPE = "google-cloud-automl";
    const automl  = require("@google-cloud/automl");

    /**
     * Called when a new instance of the node is created.
     * @param {*} config 
     */
    function AutoMLNode(config) {
        // The config contains the properties defined in the default object in the HTML or modified through configuration in the editor.
        //

        RED.nodes.createNode(this, config);  // Required by the Node-RED spec.

        const node = this;

        let credentials = null;
        if (config.account) {
            credentials = GetCredentials(config.account);
        }
        const keyFilename = config.keyFilename;
        const projectId   = config.projectId;
        const location    = config.location;
        const modelId     = config.modelId;

        let predictionServiceClient; // https://googleapis.dev/nodejs/automl/latest/v1.PredictionServiceClient.html


        /**
         * Extract JSON service account key from "google-cloud-credentials" config node.
         */

        function GetCredentials(node) {
            return JSON.parse(RED.nodes.getCredentials(node).account);
        } // GetCredentials


        /**
         * Receive an input message for processing.  The input will contain text that we wish
         * to push through language processing for sentiment analysis.
         * @param {*} msg 
         */
        async function Input(msg, send, done) {
            try {
                if (!msg.payload.payload) {
                    node.error("No data found in msg.payload.payload");
                    return;
                }
                node.debug(`ModelID: ${modelFullId}`);
                const [response] = await predictionServiceClient.predict({
                    "name":    modelFullId,
                    "payload": msg.payload.payload,
                    "params":  msg.payload.params
                });

                msg.payload = response;

                node.send(msg);
            } catch(ex) {
                if (done) {
                    done(ex);
                }
                else
                {
                    node.err(ex, msg);
                }
            }
        } // Input


        /**
         * Cleanup this node.
         */
        function Close() {
        } // Close


        // We must have EITHER credentials or a keyFilename.  If neither are supplied, that
        // is an error.  If both are supplied, then credentials will be used.
        if (credentials) {
            predictionServiceClient = new automl.PredictionServiceClient({
                "credentials": credentials
            });
        } else if (keyFilename) {
            predictionServiceClient = new automl.PredictionServiceClient({
                "keyFilename": keyFilename
            });
        } else {
            predictionServiceClient = new automl.PredictionServiceClient({});
        }

        const modelFullId = predictionServiceClient.modelPath(projectId, location, modelId);

        node.on("input", Input);
        node.on("close", Close);
    } // AutoMLNode

    RED.nodes.registerType(NODE_TYPE, AutoMLNode); // Register the node.

}; // End of export.