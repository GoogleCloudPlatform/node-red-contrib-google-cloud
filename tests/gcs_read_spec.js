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
const gcsReadNode = require('../gcs-read.js');

helper.init(require.resolve('node-red'));

describe('GCS read Node', function() {

    beforeEach((done) => {
        helper.startServer(done);
    });

    afterEach((done)=> {
        helper.unload();
        helper.stopServer(done);
    });


    it('Read the GCS file by configured name', function(done) {
        const flow = [
            {
                "id": "n1",
                "type": "google-cloud-gcs-read",
                "keyFilename": "/home/kolban/node-red/creds.json",
                "filename": "gs://kolban-test-nodered/text1.txt",
                "list": false,
                "wires": [["n2"]]
            },
            {
                "id": "n2",
                "type": "helper"
            }
        ];
        helper.load(gcsReadNode, flow, () => {
            // At this point the flow is "running".  We now need to send in some data.
            const n1 = helper.getNode("n1");
            const n2 = helper.getNode("n2");
            n2.on('input', (msg) => {
                //console.log("Got GCS data");
                //console.log(JSON.stringify(msg.payload));
                const text = msg.payload.toString();
                //console.log(text);
                if (text === "Some text to save") {
                    done();
                }
            });
            n1.receive({
                "payload": null
            });
        });
    }); // Read the GCS file by configured name

    it('Read the GCS file by dynamic file name', function(done) {
        const flow = [
            {
                "id": "n1",
                "type": "google-cloud-gcs-read",
                "keyFilename": "/home/kolban/node-red/creds.json",
                "list": false,
                "wires": [["n2"]]
            },
            {
                "id": "n2",
                "type": "helper"
            }
        ];
        helper.load(gcsReadNode, flow, () => {
            // At this point the flow is "running".  We now need to send in some data.
            const n1 = helper.getNode("n1");
            const n2 = helper.getNode("n2");
            n2.on('input', (msg) => {
                //console.log("Got GCS data");
                //console.log(JSON.stringify(msg.payload));
                const text = msg.payload.toString();
                //console.log(text);
                if (text === "Some text to save") {
                    done();
                }
            });
            n1.receive({
                "filename": "gs://kolban-test-nodered/text1.txt"
            });
        });
    }); // Read the GCS file by dynamic file name


    it('List files in bucket', function(done) {
        const flow = [
            {
                "id": "n1",
                "type": "google-cloud-gcs-read",
                "keyFilename": "/home/kolban/node-red/creds.json",
                "filename": "gs://kolban-test-nodered",
                "list": true,
                "wires": [["n2"]]
            },
            {
                "id": "n2",
                "type": "helper"
            }
        ];
        helper.load(gcsReadNode, flow, () => {
            // At this point the flow is "running".  We now need to send in some data.
            const n1 = helper.getNode("n1");
            const n2 = helper.getNode("n2");
            n2.on('input', (msg) => {
                //console.log("Got GCS data");
                //console.log(JSON.stringify(msg.payload));
                // At this point we have received a list of files in the named bucket.  The results
                // are an array of objects.
                done();
            });
            n1.receive({
                "payload": null
            });
        });
    }); // List files in bucket

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
        "id": "b2792880.d73828",
        "type": "google-cloud-gcs-read",
        "z": "5e1c1e13.ffe8",
        "account": "",
        "keyFilename": "",
        "filename": "gs://kolban-test-nodered",
        "list": true,
        "name": "",
        "x": 420,
        "y": 260,
        "wires": [
            [
                "7d2dc8cc.9f1e58"
            ]
        ]
    },
    {
        "id": "6bfd7d4a.707fc4",
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
        "x": 130,
        "y": 260,
        "wires": [
            [
                "b2792880.d73828"
            ]
        ]
    },
    {
        "id": "7d2dc8cc.9f1e58",
        "type": "debug",
        "z": "5e1c1e13.ffe8",
        "name": "",
        "active": true,
        "tosidebar": true,
        "console": false,
        "tostatus": false,
        "complete": "true",
        "targetType": "full",
        "x": 600,
        "y": 260,
        "wires": []
    }
]
*/