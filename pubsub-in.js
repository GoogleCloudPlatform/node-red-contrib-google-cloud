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

    const {PubSub} = require("@google-cloud/pubsub");

    /**
     * Extract JSON service account key from "google-cloud-credentials" config node.
     */
    function GetCredentials(node) {
        return JSON.parse(RED.nodes.getCredentials(node).account);
    }

    function GoogleCloudPubSubInNode(config) {
        let pubsub       = null;
        let subscription = null;

        RED.nodes.createNode(this, config);

        if (!config.account) {
            node.error('No credentials supplied.');
            return;
        }

        const node = this;
        const credentials = GetCredentials(config.account);


        let options = {};

        if (!config.subscription) {
            node.error('Subscription is required');
            return;
        }

        options.subscription = config.subscription;
        options.assumeJSON = config.assumeJSON;

        node.status(STATUS_DISCONNECTED);

        // Called when a new message is received from PubSub.
        function OnMessage(message) {
            if (message === null) {
                return;
            }

            // If the configuration property asked for JSON, then convert to an object.
            if (config.assumeJSON === true) {
                message.data = JSON.parse(RED.util.ensureString(message.data));
            }

            node.send({
                payload: message
            });
            message.ack();
        } // OnMessage


        function OnClose() {
            node.status(STATUS_DISCONNECTED);
            if (subscription) {
                subscription.close();  // No longer receive messages.
                subscription.removeListener('message', OnMessage);
                subscription.removeListener('error', OnError);
                subscription = null;
            }
            pubsub = null;
        } // OnClose


        if (credentials) {
            pubsub = new PubSub({
                "credentials": credentials
            });
        } else {
            node.error("missing credentials");
            return;
        }

        node.status(STATUS_CONNECTING);                              // Flag the node as connecting.
        pubsub.subscription(options.subscription).get().then((data) => {
            subscription = data[0];
            subscription.on('message', OnMessage);
            subscription.on('error',   OnClose);
            node.status(STATUS_CONNECTED);
        }).catch((reason) => {
            node.error(reason);
            node.status(STATUS_DISCONNECTED);
        });


        node.on("close", OnClose);
    } // GoogleCloudPubSubInNode

    RED.nodes.registerType("google-cloud-pubsub in", GoogleCloudPubSubInNode);
};
