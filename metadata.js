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
/* jshint esversion: 8 */
module.exports = function(RED) {
    "use strict";
    const utils = require('./utils.js');

     function CEMetaDataNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        async function Input(msg) {
            let metadata = await utils.getMetadata('/?recursive=true');
            if (metadata == null) {
                node.error('Unable to get metadata');
                return;
            }
            msg.payload = metadata;
            node.send(msg);
        } // Input

        node.on("input", Input);
    } // CEMetaDataNode


    RED.nodes.registerType('google-cloud-ce-metadata', CEMetaDataNode);
};