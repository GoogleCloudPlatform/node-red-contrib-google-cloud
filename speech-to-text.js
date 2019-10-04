/*
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
*/
/* jshint esversion: 8 */

/**
 * This node uses the GCP Speech to Text API.  The primary documentation for this service can
 * be found here:
 *
 * https://cloud.google.com/speech-to-text/docs/
 * 
 * The JavaScript docs can be found here:
 *
 * https://googleapis.dev/nodejs/speech/latest/index.html
 *
 */
module.exports = function(RED) {
    "use strict";
    const NODE_TYPE = "google-cloud-speech-to-text";
    const speech = require('@google-cloud/speech');


    function SpeechToTextNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        let speechClient = null;
        let credentials = null;

        const sampleRateHertz = config.sampleRate;
        const encoding        = config.encoding;
        const languageCode    = config.languageCode || "en-US";

        if (config.account) {
            credentials = GetCredentials(config.account);
        }
        const keyFilename = config.keyFilename;

        /**
         * Extract JSON service credentials key from "google-cloud-credentials" config node.
         */
        function GetCredentials(node) {
            return JSON.parse(RED.nodes.getCredentials(node).account);
        } // GetCredentials

        async function Input(msg) {
            // We should check that msg.payload is indeed a buffer

            const audioBytes = msg.payload;
            const audio = {
                "content": audioBytes
            };
            const config = {
                "encoding": encoding,
                "sampleRateHertz": sampleRateHertz,
                "languageCode": languageCode               // The currently supported languages can be found here https://cloud.google.com/speech-to-text/docs/languages
            };
            const request = {
                "audio": audio,
                "config": config
            };
            try {
                node.status({fill: "blue", shape: "dot", text: "processing"});
                const [response] = await speechClient.recognize(request);
                node.status({});
                msg.payload = response;
                node.send(msg);
            }
            catch(exp) {
                node.status({});
                node.error(exp);
            }
        } // Input

        // We must have EITHER credentials or a keyFilename.  If neither are supplied, that
        // is an error.  If both are supplied, then credentials will be used.
        if (credentials) {
            speechClient = new speech.SpeechClient({  // SpeechClient comes from @google-cloud/speech
                "credentials": credentials
            });
        } else if (keyFilename) {
            speechClient = new speech.SpeechClient({
                "keyFilename": keyFilename
            });
        } else {
            node.error('Missing credentials or keyFilename.');
            return;
        }

        node.on("input", Input);
    } // SpeechToTextNode

    RED.nodes.registerType(NODE_TYPE, SpeechToTextNode);
};