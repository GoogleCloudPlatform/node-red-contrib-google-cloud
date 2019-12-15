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
 */
/* jshint esversion: 8 */
module.exports = function(RED) {
    "use strict";
    const NODE_TYPE = "google-cloud-translate";
    const translate = require('@google-cloud/translate');
    let translationServiceClient;

    function TranslateNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        const projectId = config.projectId;
        const sourceLanguageCode = config.sourceLanguageCode;
        const targetLanguageCode = config.targetLanguageCode;

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
            const request = {
                "contents": [msg.payload],
                "sourceLanguageCode": sourceLanguageCode,
                "targetLanguageCode": targetLanguageCode,
                "mimeType": "text/plain",
                "parent": translationServiceClient.locationPath(projectId, "global")
            };
            try {
                const responseArray = await translationServiceClient.translateText(request);
                msg.payload = responseArray[0];
                node.send(msg);
            }
            catch(e) {
                console.log(e);
            }
        } // Input


        // We must have EITHER credentials or a keyFilename.  If neither are supplied, that
        // is an error.  If both are supplied, then credentials will be used.
        if (credentials) {
            translationServiceClient = new translate.v3beta1.TranslationServiceClient({
                "credentials": credentials
            });
        } else if (keyFilename) {
            translationServiceClient = new translate.v3beta1.TranslationServiceClient({
                "keyFilename": keyFilename
            });
        } else {
            translationServiceClient = new translate.v3beta1.TranslationServiceClient({});
        }

        node.on("input", Input);
    } // TranslateNode


    RED.nodes.registerType(NODE_TYPE, TranslateNode);
};