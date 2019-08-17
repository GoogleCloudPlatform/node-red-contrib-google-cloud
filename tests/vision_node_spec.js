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
const visionNode = require('../vision.js');
const https = require("https");

helper.init(require.resolve('node-red'));

describe('vision Node', function() {
    this.timeout(10000);  // We must increase the timeout as Vision APIs can take many seconds to complete.

    beforeEach((done) => {
        helper.startServer(done);
    });

    afterEach((done)=> {
        helper.unload();
        helper.stopServer(done);
    });

    // Test that a URL pointing to an image works.

    it('process vision from URL', (done) => {
        const flow = [
            {
                "id": "n1",
                "type": "google-cloud-vision",
                "faceDetection": true,
                "landmarkDetection": true,
                "logoDetection": true,
                "labelDetection": true,
                "textDetection": true,
                "documentTextDetection": true,
                "safeSearchDetection": true,
                "imageProperties": true,
                "cropHints": false,
                "webDetection": true,
                "productSearch": true,
                "objectLocalization": true,            
                "keyFilename": "/home/kolban/node-red/creds.json",
                "wires": [["n2"]]
            },
            { id: "n2", type: "helper" }
        ];
        helper.load(visionNode, flow, () => {
            // At this point the flow is "running".  We now need to send in some data.
            const n1 = helper.getNode("n1");
            const n2 = helper.getNode("n2");
            n2.on('input', (msg) => {
                if (!msg.error) {
                    done();
                }
            });
            n1.receive({
                "filename": "https://upload.wikimedia.org/wikipedia/commons/8/85/Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg"
            });
        });
    }); // process vision from URL

    // Test that a buffer of data works..
    it('process vision from data', (done) => {
        const flow = [
            {
                "id": "n1",
                "type": "google-cloud-vision",
                "faceDetection": true,
                "landmarkDetection": true,
                "logoDetection": true,
                "labelDetection": true,
                "textDetection": true,
                "documentTextDetection": true,
                "safeSearchDetection": true,
                "imageProperties": true,
                "cropHints": false,
                "webDetection": true,
                "productSearch": true,
                "objectLocalization": true,            
                "keyFilename": "/home/kolban/node-red/creds.json",
                "wires": [["n2"]]
            },
            { id: "n2", type: "helper" }
        ];
        helper.load(visionNode, flow, () => {
            // At this point the flow is "running".  We now need to send in some data.
            const n1 = helper.getNode("n1");
            const n2 = helper.getNode("n2");
            n2.on('input', (msg) => {
                if (!msg.error) {
                    done();
                    return;
                }
            });

            // Read the binary data from the image URL and build a buffer from it.
            // Now that we have a buffer, invoke the node passing in that buffer into
            // the msg.payload.
            let imageBuffer = null;
            https.get("https://upload.wikimedia.org/wikipedia/commons/8/85/Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg", (res) => {
                res.on('data', (chunk) => {
                    if (imageBuffer === null) {
                        imageBuffer = chunk;
                    } else {
                        imageBuffer = Buffer.concat([imageBuffer, chunk]);
                    }
                });
                res.on('end', () => {
                    n1.receive({
                        "payload": imageBuffer
                    });
                });
            });

        });
    }); // process vision from data

});

/*
[
    {
        "id": "9195b0c2.a6b5c",
        "type": "tab",
        "label": "Vision",
        "disabled": false,
        "info": ""
    },
    {
        "id": "9ccfcd61.d47e1",
        "type": "google-cloud-vision",
        "z": "9195b0c2.a6b5c",
        "account": "",
        "faceDetection": true,
        "landmarkDetection": true,
        "logoDetection": true,
        "labelDetection": true,
        "textDetection": true,
        "documentTextDetection": true,
        "safeSearchDetection": true,
        "imageProperties": true,
        "cropHints": false,
        "webDetection": true,
        "productSearch": true,
        "objectLocalization": true,
        "name": "",
        "x": 510,
        "y": 160,
        "wires": [
            [
                "a3e179f0.613668"
            ]
        ],
        "info": "Perform image analysis on the image found on\nthe internet.  The results are written to the \nmessage payload."
    },
    {
        "id": "21b60640.8b6a5a",
        "type": "inject",
        "z": "9195b0c2.a6b5c",
        "name": "Run flow",
        "topic": "",
        "payload": "",
        "payloadType": "str",
        "repeat": "",
        "crontab": "",
        "once": false,
        "onceDelay": 0.1,
        "x": 160,
        "y": 160,
        "wires": [
            [
                "2a0a4e66.393342"
            ]
        ],
        "info": "Run the sample flow."
    },
    {
        "id": "2a0a4e66.393342",
        "type": "change",
        "z": "9195b0c2.a6b5c",
        "name": "Set image url",
        "rules": [
            {
                "t": "set",
                "p": "filename",
                "pt": "msg",
                "to": "https://upload.wikimedia.org/wikipedia/commons/8/85/Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg",
                "tot": "str"
            }
        ],
        "action": "",
        "property": "",
        "from": "",
        "to": "",
        "reg": false,
        "x": 340,
        "y": 160,
        "wires": [
            [
                "9ccfcd61.d47e1"
            ]
        ],
        "info": "Set a hard-coded URL to the image that we wish to examine.\nIn this example, we are using the Eifful Tower located in Paris.\nThe image is public from Wikipedia."
    },
    {
        "id": "a3e179f0.613668",
        "type": "debug",
        "z": "9195b0c2.a6b5c",
        "name": "Log attributes",
        "active": true,
        "tosidebar": true,
        "console": false,
        "tostatus": false,
        "complete": "payload",
        "targetType": "msg",
        "x": 680,
        "y": 160,
        "wires": [],
        "info": "Log the analysis results to the debug panel."
    },
    {
        "id": "430e8e41.477fb",
        "type": "comment",
        "z": "9195b0c2.a6b5c",
        "name": "README",
        "info": "In this example we illustrate the use of the vision\nnode to process a web hosted image of the Eifful Tower.\nThe URL to the image is built and the Vision service\nwithin the Google Cloud Platform is invoked.  The results\nof analysis are then logged to the debug panel.",
        "x": 140,
        "y": 100,
        "wires": []
    }
]
*/