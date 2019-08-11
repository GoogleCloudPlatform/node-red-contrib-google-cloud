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
 * The node type is "gcp-language-sentiment".
 *
 * msg.payload  = The document to be examined.
 *
 */
module.exports = function(RED) {
    "use strict";

    const NODE_TYPE = "google-cloud-language-sentiment";
    const language  = require("@google-cloud/language");

    /**
     * Called when a new instance of the node is created.
     * @param {*} config 
     */
    function SentimentNode(config) {
        // The config contains the properties defined in the default object in the HTML or modified through configuration in the editor.
        //

        RED.nodes.createNode(this, config);  // Required by the Node-RED spec.

        const node = this;
        const credentials = GetCredentials(config.account);
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
        async function Input(msg) {
            if (!msg.payload) {
                node.error("No data found in msg.payload");
                return;
            }

            const document = {
                type: 'PLAIN_TEXT',
            };

            if (msg.payload instanceof Buffer) {
                document.content = msg.payload.toString();
            } else if (msg.payload instanceof String || typeof msg.payload === 'string') {
                document.content = msg.payload;
            } else {
                node.error("msg.payload neither String nor Buffer");
                return;
            }

            const [analyzeSentimentResponse] = await languageServiceClient.analyzeSentiment({"document": document});  // Process the document for sentiment.
            msg.sentiment = analyzeSentimentResponse.documentSentiment; // Data: https://googleapis.dev/nodejs/language/latest/google.cloud.language.v1.html#.Sentiment
            // The sentiment field contains magnitude and score.
            node.send(msg);
        } // Input


        /**
         * Cleanup this node.
         */
        function Close() {
        } // Close
        

        node.on("input", Input);
        node.on("close", Close);

        if (credentials) {
            // API: https://googleapis.dev/nodejs/language/latest/v1.LanguageServiceClient.html
            languageServiceClient = new language.LanguageServiceClient({
                "credentials": credentials
            });
        } else {
            node.error("missing credentials");
        }
    } // SentimentNode

    RED.nodes.registerType(NODE_TYPE, SentimentNode); // Register the node.

}; // End of export.