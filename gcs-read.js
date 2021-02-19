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
 * The node type is "gcs-read".
 *
 * This node will read the content of a GCS file (object) and place that data
 * in msg.payload before flowing onwards.  Alterantively, it can return the list
 * of objects found in the bucket.
 *
 * # Inputs
 * * msg.filename = File name to be read.  The file name will be of the form gs://[BUCKET]/[FILE_PATH]
 *
 * # Outputs
 *  * msg.payload  = Data read from file as a Buffer.
 *  * msg.metadata = The metadata associated with the file.
 *
 * If both msg.filename and configuration property filename are supplied then msg.filename will
 * be used.
 */
/* jshint esversion: 8 */
module.exports = function(RED) {
    "use strict";
    const NODE_TYPE = "google-cloud-gcs-read";
    const {Storage} = require("@google-cloud/storage");

    /**
     * Called when a new instance of the node is created.
     * @param {*} config 
     */
    function GCSReadNode(config) {
        // The config contains the properties defined in the default object in the HTML or modified through configuration in the editor.
        //

        RED.nodes.createNode(this, config);  // Required by the Node-RED spec.

        let storage;
        let credentials = null;
        const node = this;
        if (config.account) {
            credentials = GetCredentials(config.account);
        }
        const keyFilename = config.keyFilename;
        const isList      = config.list;
        const toBase64    = config.toBase64;
        let fileName_option;
        if (!config.filename) {
            fileName_option = "";
        } else {
            fileName_option = config.filename.trim();
        }

        /**
         * Extract JSON service credentials key from "google-cloud-credentials" config node.
         */
        function GetCredentials(node) {
            return JSON.parse(RED.nodes.getCredentials(node).account);
        } // GetCredentials


        async function readFile(msg, gsURL) {
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

            // Get the metadata for the object/file and store it at msg.metadata.
            try {
                const [metadata] = await file.getMetadata();
                msg.metadata = metadata;
            }
            catch(err) {
                node.error(`getMetadata error: ${err.message}`);
                return;
            }

            msg.payload = null; // Set the initial output to be nothing.

            const readStream = file.createReadStream();

            // Pre-allocate the download buffer
            const fileSize = parseInt(msg.metadata.size, 10)
            msg.payload = Buffer.allocUnsafe(fileSize)
            let pos = 0

            readStream.on("error", (err) => {
                node.error(`readStream error: ${err.message}`);
            });

            readStream.on("end", () => {
                // TBD: Currently we are returning a Buffer.  We may wish to consider examining
                // the metadata and see if it of text/* and, if it is, convert the payload
                // to a string.

                // If we wish to be base64 encoded, do it now.
                if (toBase64) {
                    msg.payload = msg.payload.toString('base64');
                }
                node.send(msg);   // Send the message onwards to the next node.
            });

            readStream.on("data", (data) => {
                if (data == null) {
                    return;
                }
                msg.payload.fill(data, pos, pos + data.length)
                pos += data.length
            });

        } // readFile

        async function listFiles(msg, gsURL) {
            // At this point we have a URL of the form gs://[BUCKET]/[FILENAME].  We now want
            // to parse this out and get the bucket and file.

            const parts = gsURL.match(/gs:\/\/([^\/]+)(?:\/(.*))?$/);
            if (!parts && parts.length != 3) {
                node.error(`Badly formed URL: ${gsURL}`);
                return;
            }

            const bucketName = parts[1];
            const fileName   = parts[2];

            const bucket = storage.bucket(bucketName);
            const getFilesOptions = {
                prefix: fileName
            };
            const [files] = await bucket.getFiles(getFilesOptions);
            const retArray = [];
            files.forEach((file) => {
                retArray.push(file.metadata);
            });
            msg.payload = retArray;
            node.send(msg);
        }
        
        /**
         * Receive an input message for processing.
         * @param {*} msg 
         */
        function Input(msg) {
            let gsURL;

            if (!msg.filename && fileName_option === "") {   // Validate that we have been passed the mandatory filename parameter.
                node.error('No filename found in msg.filename or configuration.');
                return;
            }

            if (typeof msg.filename != "string" && fileName_option === "") { // Validate that the mandatory filename is a string.
                node.error("The msg.filename was not a string");
                return;
            }

            // We have two possibilities for supplying a filename.  These are msg.filename at runtime
            // and the filename configuration property.  If both are present, then msg.filename will
            // be used.
            if (msg.filename) {
                gsURL = msg.filename.trim();
            } else {
                gsURL = fileName_option;
            }

            if (isList) {
                listFiles(msg, gsURL);
            } else {
                readFile(msg, gsURL);
            }
        } // Input


        /**
         * Cleanup this node.
         */
        function Close() {
        } // Close


        // We must have EITHER credentials or a keyFilename.  If neither are supplied, that
        // is an error.  If both are supplied, then credentials will be used.
        if (credentials) {
            storage = new Storage({
                "credentials": credentials
            });
        } else if (keyFilename) {
            storage = new Storage({
                "keyFilename": keyFilename
            });
        } else {
            storage = new Storage({});
        }

        node.on("input", Input);
        node.on("close", Close);
    } // GCSReadNode

    RED.nodes.registerType(NODE_TYPE, GCSReadNode); // Register the node.
};
