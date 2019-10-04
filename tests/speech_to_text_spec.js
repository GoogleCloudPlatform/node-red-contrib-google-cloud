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
 */
/* jshint esversion: 8 */
const should = require("should");
const helper = require('node-red-node-test-helper');
const speechToTextNode = require('../speech-to-text.js');
const https = require("https");

helper.init(require.resolve('node-red'));

describe('speech to text Node', function() {
    this.timeout(20000);  // We must increase the timeout as Speech APIs can take many seconds to complete.

    beforeEach((done) => {
        helper.startServer(done);
    });

    afterEach((done)=> {
        helper.unload();
        helper.stopServer(done);
    });


    // Test that a buffer of data works..
    it('process speech to text from data', (done) => {
        const flow = [
            {
                "id": "n1",
                "type": "google-cloud-speech-to-text",
                "keyFilename": "/home/kolban/node-red/creds.json",
                "sampleRate": "8000",
                "encoding": "LINEAR16",
                "wires": [["n2"]]
            },
            { id: "n2", type: "helper" }
        ];
        helper.load(speechToTextNode, flow, () => {
            // At this point the flow is "running".  We now need to send in some data.
            const n1 = helper.getNode("n1");
            const n2 = helper.getNode("n2");
            n2.on('input', (msg) => {
                //console.log("Got audio transcription!");
                //console.log(JSON.stringify(msg.payload));
                if (!msg.error) {
                    done();
                    return;
                }
            });

            // Read the binary data from the audio URL and build a buffer from it.
            // Now that we have a buffer, invoke the node passing in that buffer into
            // the msg.payload.
            let audioBuffer = null;
            https.get("https://www.voiptroubleshooter.com/open_speech/american/OSR_us_000_0030_8k.wav", (res) => {
                res.on('data', (chunk) => {
                    if (audioBuffer === null) {
                        audioBuffer = chunk;
                    } else {
                        audioBuffer = Buffer.concat([audioBuffer, chunk]);
                    }
                });
                res.on('end', () => {
                    n1.receive({
                        "payload": audioBuffer
                    });
                });
            });

        });
    }); // process vision from data

});

/*

[
    {
        "id": "5e1c1e13.ffe8",
        "type": "tab",
        "label": "Flow 1",
        "disabled": false,
        "info": ""
    },
    {
        "id": "cead5188.6ca0a",
        "type": "google-cloud-speech-to-text",
        "z": "5e1c1e13.ffe8",
        "account": "",
        "keyFilename": "",
        "name": "",
        "sampleRate": "8000",
        "encoding": "LINEAR16",
        "x": 440,
        "y": 180,
        "wires": [
            [
                "ad6cc9f.a9c2738"
            ]
        ]
    },
    {
        "id": "ad6cc9f.a9c2738",
        "type": "debug",
        "z": "5e1c1e13.ffe8",
        "name": "",
        "active": true,
        "tosidebar": true,
        "console": false,
        "tostatus": false,
        "complete": "false",
        "x": 660,
        "y": 260,
        "wires": []
    },
    {
        "id": "8df90693.77fa68",
        "type": "google-cloud-gcs-read",
        "z": "5e1c1e13.ffe8",
        "account": "",
        "keyFilename": "",
        "filename": "gs://kolban-test/OSR_us_000_0010_8k.wav",
        "list": false,
        "name": "",
        "x": 240,
        "y": 280,
        "wires": [
            [
                "cead5188.6ca0a"
            ]
        ]
    },
    {
        "id": "9fb4f231.97422",
        "type": "inject",
        "z": "5e1c1e13.ffe8",
        "name": "",
        "topic": "",
        "payload": "",
        "payloadType": "str",
        "repeat": "",
        "crontab": "",
        "once": false,
        "onceDelay": 0.1,
        "x": 110,
        "y": 460,
        "wires": [
            [
                "8df90693.77fa68"
            ]
        ]
    }
]
*/