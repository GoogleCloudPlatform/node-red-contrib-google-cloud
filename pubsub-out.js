// Copyright 2019 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/* jshint esversion: 8 */
module.exports = function(RED) {
    "use strict";

    const STATUS_CONNECTED = {
        fill:  "green",
        shape: "dot",
        text:  "connected"
    };

    const STATUS_DISCONNECTED = {
        fill:  "red",
        shape: "dot",
        text:  "disconnected"
    };

    const STATUS_CONNECTING = {
        fill:  "yellow",
        shape: "dot",
        text:  "connecting"
    };

    const STATUS_PUBLISHING = {
        fill:  "green",
        shape: "ring",
        text:  "publishing"
    };

    const {PubSub} = require("@google-cloud/pubsub");

    /**
     * Extract JSON service account key from "google-cloud-credentials" config node.
     */
    function GetCredentials(node) {
        return JSON.parse(RED.nodes.getCredentials(node).account);
    }


    function GoogleCloudPubSubOutNode(config) {
        let topic  = null;
        let topicReady = null; // A Promise that will be resolved when the topic is ready.
        let pubsub = null;
        RED.nodes.createNode(this, config);

        const node = this;

        let projectId = config.projectId;
        if (!projectId || projectId.trim().length == 0) {
            projectId = null;
        }

        let credentials = null;
        if (config.account) {
            credentials = GetCredentials(config.account);
        }
        const keyFilename = config.keyFilename;

        if (!config.topic) {
            node.error('No topic supplied!');
            return;
        }

        node.status(STATUS_DISCONNECTED);

        // Called to publish a new message.
        async function OnInput(msg) {
            if (msg == null || !msg.payload || msg.payload == "") {
                return;
            }

            await topicReady;
            node.status(STATUS_PUBLISHING);
            try {
                await topic.publish(RED.util.ensureBuffer(msg.payload));
                node.status(STATUS_CONNECTED);
                node.send(msg); // The message has been published so we can forward through the flow.
            }
            catch(e) {
                node.status(STATUS_DISCONNECTED);
                node.error(e);
            }
        } // OnInput

        function OnClose() {
            node.status(STATUS_DISCONNECTED);
            pubsub = null;
        } // OnClose

        // We must have EITHER credentials or a keyFilename.  If neither are supplied, that
        // is an error.  If both are supplied, then credentials will be used.
        if (credentials) {
            pubsub = new PubSub({
                "projectId": projectId,
                "credentials": credentials
            });
        } else if (keyFilename) {
            pubsub = new PubSub({
                "projectId": projectId,
                "keyFilename": keyFilename
            });
        } else {
            pubsub = new PubSub({
                "projectId": projectId,
            });
        }

        node.status(STATUS_CONNECTING);

        topicReady = new Promise((resolve, reject) => {
            pubsub.topic(config.topic).get().then((data) => {
                topic = data[0];
                node.status(STATUS_CONNECTED);
                resolve();
            }).catch((reason) => {
                node.status(STATUS_DISCONNECTED);
                node.error(reason);
                reject(reason);
            });
        }); // topicReady


        node.on('close', OnClose);
        node.on('input', OnInput);
    } // GoogleCloudPubSubOutNode

    RED.nodes.registerType("google-cloud-pubsub out", GoogleCloudPubSubOutNode);
};
