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
 * The node type is "gcp-language-entities".
 *
 * msg.payload  = The document to be examined.
 * 
 * The configuration parameters are:
 * 
 * * languageCode - The language code to be used.
 *
 */
/* jshint esversion: 8 */
module.exports = function(RED) {
    "use strict";

    const NODE_TYPE = "google-cloud-language-entities";
    const language  = require("@google-cloud/language");

    /**
     * Called when a new instance of the node is created.
     * @param {*} config 
     */
    function EntitiesNode(config) {
        // The config contains the properties defined in the default object in the HTML or modified through configuration in the editor.
        //

        RED.nodes.createNode(this, config);  // Required by the Node-RED spec.

        const node = this;

        let credentials = null;
        if (config.account) {
            credentials = GetCredentials(config.account);
        }
        const keyFilename = config.keyFilename;
        const languageCode = config.languageCode || "en";

        let languageServiceClient; // https://googleapis.dev/nodejs/language/latest/v1.LanguageServiceClient.html


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
                if (!msg.payload) {
                    node.error("No data found in msg.payload");
                    return;
                }

                const document = {
                    "type":     'PLAIN_TEXT',
                    "language": languageCode            // https://cloud.google.com/natural-language/docs/languages#entity_analysis
                };

                if (msg.payload instanceof Buffer) {
                    document.content = msg.payload.toString();
                } else if (msg.payload instanceof String || typeof msg.payload === 'string') {
                    document.content = msg.payload;
                } else {
                    node.error("msg.payload neither String nor Buffer");
                    return;
                }

                const [analyzeEntitiesResponse] = await languageServiceClient.analyzeEntities({"document": document});  // Process the document for sentiment.
                msg.entities = analyzeEntitiesResponse.entities; // Data: https://googleapis.dev/nodejs/language/latest/google.cloud.language.v1.Entity.html
                // The sentiment field contains magnitude and score.
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
            languageServiceClient = new language.LanguageServiceClient({
                "credentials": credentials
            });
        } else if (keyFilename) {
            languageServiceClient = new language.LanguageServiceClient({
                "keyFilename": keyFilename
            });
        } else {
            languageServiceClient = new language.LanguageServiceClient({});
        }

        node.on("input", Input);
        node.on("close", Close);
    } // SentimentNode

    RED.nodes.registerType(NODE_TYPE, EntitiesNode); // Register the node.

}; // End of export.