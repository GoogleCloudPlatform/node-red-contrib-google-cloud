/*
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
*/
/* jshint esversion: 8 */

/**
 * This node uses the GCP Text To Speech API.  The primary documentation for this service can
 * be found here:
 *
 * https://cloud.google.com/text-to-speech/docs
 * 
 * The JavaScript docs can be found here:
 *
 * https://googleapis.dev/nodejs/text-to-speech/latest/index.html
 *
 * We will expect a text string at `msg.payload` which will contain the text to be spoken.
 * The result will be found at:
 * msg.payload.audio.data - MP3 or LINEAR16 data
 * msg.payload.audio.mime - Mime type of data
 */
module.exports = function(RED) {
    "use strict";
    const NODE_TYPE = "google-cloud-text-to-speech";
    const textToSpeech = require('@google-cloud/text-to-speech');


    function TextToSpeechNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        let textToSpeechClient = null;
        let credentials = null;

        const languageCode = config.languageCode || "en-US";
        const gender       = config.gender || "MALE";
        const encoding     = config.encoding || "MP3";
        const pitch        = config.pitch || 0;
        const rate         = config.rate || 1;
        const voiceName    = config.voiceName || "";

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

            const request = {
                "input": {
                    "text": msg.payload
                },
                "voice": {
                    "languageCode": languageCode,
                    "ssmlGender": gender
                },
                "audioConfig": {
                    "audioEncoding": encoding,
                    "pitch": pitch,
                    "speakingRate": rate
                }
            };
            if (voiceName.length > 0) {
                request.voice.name = voiceName;
            }
            try {
                node.status({fill: "blue", shape: "dot", text: "processing"});
                const [response] = await textToSpeechClient.synthesizeSpeech(request);
                node.status({});
                msg.payload = {
                    "audio": {
                        "data": response.audioContent
                    }
                };
                switch(encoding) {
                    case "MP3":
                        msg.payload.audio.mime = "audio/mpeg";
                        break;
                    case "LINEAR16":
                        msg.payload.audio.mime = "audio/wav";
                        break;
                    case "OGG_OPUS":
                        msg.payload.audio.mime = "audio/ogg";
                        break;
                    default:
                }
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
            textToSpeechClient = new textToSpeech.TextToSpeechClient({  // SpeechClient comes from @google-cloud/speech
                "credentials": credentials
            });
        } else if (keyFilename) {
            textToSpeechClient = new textToSpeech.TextToSpeechClient({
                "keyFilename": keyFilename
            });
        } else {
            textToSpeechClient = new textToSpeech.TextToSpeechClient({});
        }

        node.on("input", Input);
    } // SpeechToTextNode

    RED.nodes.registerType(NODE_TYPE, TextToSpeechNode);
};