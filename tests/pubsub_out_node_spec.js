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
const pubsubInNode = require('../pubsub-out.js');
const {PubSub} = require('@google-cloud/pubsub');

helper.init(require.resolve('node-red'));

describe('pubsub_out Node', () => {

    const pubsub = new PubSub();

    beforeEach((done) => {
        helper.startServer(done);
    });

    afterEach((done)=> {
        helper.unload();
        helper.stopServer(done);
    });

    // Create a PubSub subscription using API and then fire a flow that publishes a message.
    // The subscription should wake up and compare that the received text is what was expected.
    it('send pubsub message', (done) => {
        const text = "Hello World!";
        const subscription = pubsub.subscription('node-red-subscription');
        subscription.on('message', (message) => {
            message.ack();
            subscription.close();
            message.data.toString().should.be.equal(text);
            done();
        });
        // This flow publishes a message to the topic.
        const flow = [
            {
                "id": "n1",
                "type": "google-cloud-pubsub out",
                "topic": "node-red-topic",
                "keyFilename": "/home/kolban/node-red/creds.json",
            }
        ];
        helper.load(pubsubInNode, flow, () => {
            // At this point the flow is "running".  We now need to send in some data.
            const n1 = helper.getNode("n1");
            n1.receive({payload: text});
        });
    }); // send pubsub message

});