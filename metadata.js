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
*
*
*
* A compute engine running in GCP has associated metadata.  This node retrieves
* that metadata and places it in the msg.payload of the outgoing message.
*
* For further GCP information on this topic see:
* https://cloud.google.com/compute/docs/storing-retrieving-metadata
* 
*/
module.exports = function(RED) {
    "use strict";
    const NODE_TYPE = "google-cloud-ce-metadata";
    const request = require('request');


    function CEMetaDataNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        function Input(msg) {
    //
    // Make a request to the GCP metadata server to retrieve the details of the environment.
    // When a response returns, convert it to a JS object and set it within msg.payload.
    // The response from the REST request will be a JSON string.
    //
            const options = {
                url: 'http://metadata.google.internal/computeMetadata/v1/?recursive=true',
                headers: {
                    "Metadata-Flavor": "Google"
                }
            };
            request(options, (error, response, body) => {
                if (error) {
                    node.error(error);
                    return;
                }
                msg.payload = JSON.parse(body);
                node.send(msg);
            });
        } // Input


        node.on("input", Input);
    } // CEMetaDataNode


    RED.nodes.registerType(NODE_TYPE, CEMetaDataNode);
};