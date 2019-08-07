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
 * The node type is "gcs-write".
 * 
 * msg.payload  = data to be written.
 * msg.filename = file name to be written.  The file name will be of the form gs://[BUCKET]/[FILE_PATH]
 * msg.contentztype = Content type setting for data (optional)
 */
module.exports = function(RED) {
    "use strict";
    const NODE_TYPE = 'google-cloud-gcs-write';
    const {Storage} = require('@google-cloud/storage');

    /**
     * Called when a new instance of the node is created.
     * @param {*} config 
     */
    function GCSWriteNode(config) {
        // The config contains the properties defined in the default object in the HTML or modified through configuration in the editor.
        //

        RED.nodes.createNode(this, config);  // Required by the Node-RED spec.

        let storage;
        const node = this;
        const credentials = GetCredentials(config.account);

        /**
         * Extract JSON service account key from "google-cloud-credentials" config node.
         */
        
        function GetCredentials(node) {
            return JSON.parse(RED.nodes.getCredentials(node).account);
        }
        
        /**
         * Receive an input message for processing.
         * @param {*} msg 
         */
        function Input(msg) {
            if (!msg.filename) {
                node.error('No filename found in msg.filename');
                return;
            }
            if (!msg.payload) {
                node.error('No data found in msg.payload');
                return;
            }

            let gsURL = RED.util.ensureString(msg.filename).trim();

            // At this point we have a URL of the form gs://[BUCKET]/[FILENAME].  We now want
            // to parse this out and get the bucket and file.

            const parts = gsURL.match(/gs:\/\/([^\/]*)\/(.*)$/);
            if (!parts && parts.length != 3) {
                node.error(`Badly formed URL: ${gsURL}`);
                return;
            }

            const bucketName = parts[1];
            const fileName   = parts[2];

            const bucket = storage.bucket(bucketName);
            const file   = bucket.file(fileName);

            const options = {};
            if (msg.contenttype) {
                options.contentType = RED.util.ensureString(msg.contentType);
            }

            const writeStream = file.createWriteStream(options);

            writeStream.on('error', (err) => {
                node.error(`writeStream error: ${JSON.stringify(err)}`);
            });
            writeStream.write(msg.payload); // Write the data to the object.
            writeStream.end();
        } // Input


        /**
         * Cleanup this node.
         */
        function Close() {
        }
        
        node.on('input', Input);
        node.on('close', Close);

        if (credentials) {
            storage = new Storage({
                "credentials": credentials
            });
        } else {
            node.error('missing credentials');
        }
    } // GCSWriteNode

    RED.nodes.registerType(NODE_TYPE, GCSWriteNode); // Register the node.
};