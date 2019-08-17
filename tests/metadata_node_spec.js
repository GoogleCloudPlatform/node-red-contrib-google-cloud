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
const metadataNode = require('../metadata.js');

helper.init(require.resolve('node-red'));

describe('metadata Node', () => {
    beforeEach((done) => {
        helper.startServer(done);
    });

    afterEach((done)=> {
        helper.unload();
        helper.stopServer(done);
    });

    it('meta data returned', (done) => {
        const flow = [
            { id: "n1", type: "google-cloud-ce-metadata", name: "metadata1", keyFilename: "/home/kolban/node-red/creds.json", wires: [["n2"]]},
            { id: "n2", type: "helper" }
        ];
        helper.load(metadataNode, flow, () => {
            // At this point the flow is "running".  We now need to send in some data.
            const n1 = helper.getNode("n1");
            const n2 = helper.getNode("n2");
            n2.on('input', (msg) => {
                msg.payload.should.be.type('object');
                done();
            });
            n1.receive({payload: ""});
        });
    });


});

/*
[
    {
        "id": "3e46e5f5.0b0a0a",
        "type": "tab",
        "label": "Flow 3",
        "disabled": false,
        "info": ""
    },
    {
        "id": "702dccdd.173f44",
        "type": "google-cloud-language-sentiment",
        "z": "3e46e5f5.0b0a0a",
        "account": "",
        "keyFilename": "/home/kolban/node-red/creds.json",
        "name": "",
        "x": 240,
        "y": 420,
        "wires": [
            []
        ]
    }
]
*/