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
const pubsubInNode = require('../pubsub-in.js');
const {PubSub} = require('@google-cloud/pubsub');

helper.init(require.resolve('node-red'));

describe('pubsub_in Node', () => {

    const pubsub = new PubSub();

    beforeEach((done) => {
        helper.startServer(done);
    });

    afterEach((done)=> {
        helper.unload();
        helper.stopServer(done);
    });

    it('receive pubsub message', (done) => {
        const flow = [
            {
                "id": "n1",
                "type": "google-cloud-pubsub in",
                "subscription": "node-red-subscription",
                "name": "pubsubin",
                "keyFilename": "/home/kolban/node-red/creds.json",
                "wires": [["n2"]]
            },
            { id: "n2", type: "helper" }
        ];
        helper.load(pubsubInNode, flow, () => {
            // At this point the flow is "running".  We now need to send in some data.
            const n1 = helper.getNode("n1");
            const n2 = helper.getNode("n2");
            const text = "Hello World!"; // The message we publish which should be received by the flow.
            n2.on('input', (msg) => {
                msg.payload.toString().should.be.equal(text);
                done();
            });
            // Publish a message using the API which should now wake us up.
            const topic = pubsub.topic('node-red-topic');
            topic.publish(Buffer.from(text));
        });
    });

});

/*
[
    {
        "id": "cba9b717.aa83c8",
        "type": "tab",
        "label": "Flow 3",
        "disabled": false,
        "info": ""
    },
    {
        "id": "9ceb0ca8.145a6",
        "type": "google-cloud-pubsub in",
        "z": "cba9b717.aa83c8",
        "account": "",
        "keyFilename": "/zzz",
        "subscription": "node-red-subscription",
        "assumeJSON": false,
        "name": "",
        "x": 160,
        "y": 320,
        "wires": [
            []
        ]
    }
]
*/