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
 * This node provides DLP processing.  We will assume that msg.payload
 * contains the original data that may contain sensistive data.
 * 
 * The configuration for the node includes:
 * mode - The mode to execute the request.  The options are:
 * 
 * * get - Get the content of a document.
 * * update - Update the content of a document.
 * * delete - Delete a document.
 * * set - Set the content of a document which replaces what might have been there already.
 * * query - Run a query.  The input must include msg.payload.query which must be an array (or an object) which contains:
 *  * fieldPath
 *  * opStr
 *  * value
 *
 */
/* jshint esversion: 8 */
module.exports = function(RED) {
    "use strict";
    const NODE_TYPE = "google-cloud-firestore";
    const {Firestore} = require('@google-cloud/firestore');
    let firestore;

    function FireStoreNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        const staticQuery = config.query;
        const projectId = config.projectId;

        let credentials = null;
        if (config.account) {
            credentials = GetCredentials(config.account);
        }
        const keyFilename = config.keyFilename;
        const mode = config.mode;  // Get the mode that we are to perform.  One of get/set/update/delete.

        /**
         * Extract JSON service account key from "google-cloud-credentials" config node.
         */
        
        function GetCredentials(node) {
            return JSON.parse(RED.nodes.getCredentials(node).account);
        }

        // Called when a message arrives at the node.  The function must be flagged as async as we are going
        // to perform waits on promises to be resolved.
        async function Input(msg) {
            let collection;
            // Set
            if (!msg.payload.path || typeof msg.payload.path != "string") {
                node.error('msg.payload.path not set properly.');
                return;
            }

            // For set/get commands, we need a payload content.
            if (mode == 'set' || mode == 'update') {
                if (!msg.payload.content) {
                    node.error('msg.payload.content not set properly.');
                    return;
                }
            }
            if (mode == 'set' || mode == 'update' || mode == 'delete' || mode == 'get') {
                const document = firestore.doc(msg.payload.path);
            }

            if (mode == 'query') {
                collection = firestore.collection(msg.payload.path);
                if (!msg.payload.query || !(Array.isArray(msg.payload.query) || (typeof msg.payload.query === "object"))) {
                    node.error('msg.payload.query not set properly.'); // Not an array or object
                    return; 
                }
            }

            try {
                if (mode == 'set') {
                    await document.set(msg.payload.content);
                    console.log(`Document written to ${msg.payload.path}`);
                } else if (mode == 'update') {
                    await document.update(msg.payload.content);
                    console.log(`Document updated at ${msg.payload.path}`);
                } else if (mode == 'delete') {
                    await document.delete();
                    console.log(`Document deleted at ${msg.payload.path}`);
                } else if (mode == 'get') {
                    const documentSnapshot = await document.get();
                    console.log(`Document retrieved from ${msg.payload.path}`);
                    msg.payload = documentSnapshot.data();
                    console.log(JSON.stringify(msg.payload));
                } else if (mode == 'query') {
                    let query = collection;
                    if (Array.isArray(msg.payload.query)) {
                        msg.payload.query.forEach((element) => {
                            // Check that each element of the query array has the required properties.
                            if (
                                !element.hasOwnProperty('fieldPath') ||
                                !element.hasOwnProperty('opStr') ||
                                !element.hasOwnProperty('value')) {
                                node.error(`msg.payload.query has invalid member: ${JSON.stringify(element)}`);
                                return; 
                            }
                            query = query.where(element.fieldPath, element.opStr, element.value);
                        });
                    } else {
                        // Check that the query object has the required properties.
                        if (
                            !msg.payload.query.hasOwnProperty('fieldPath') ||
                            !msg.payload.query.hasOwnProperty('opStr') ||
                            !msg.payload.query.hasOwnProperty('value')) {
                            node.error(`msg.payload.query is bad object: ${JSON.stringify(msg.payload.query)}`);
                            return; 
                        }
                        query = query.where(msg.payload.query.fieldPath, msg.payload.query.opStr, msg.payload.query.value);
                    }
                    const querySnapshot = await query.get();
                    let results = [];
                    querySnapshot.forEach((queryDocumentSnapshot) => {
                        results.push(queryDocumentSnapshot.data());
                    });
                    msg.payload = results;

                } else {
                    node.error('Unexpected mode');
                    return;
                }
                node.send(msg);
            } // End of try
            catch(e) {
                if (e.details) {
                    node.error(e.details);
                } else {
                    console.log(e);
                }
            }
        } // Input


        // We must have EITHER credentials or a keyFilename.  If neither are supplied, that
        // is an error.  If both are supplied, then credentials will be used.
        if (credentials) {
            firestore = new Firestore({
                "projectId": projectId,
                "credentials": credentials
            });
        } else if (keyFilename) {
            firestore = new Firestore({
                "projectId": projectId,
                "keyFilename": keyFilename
            });
        } else {
            node.error('Missing credentials or keyFilename.');
            return;
        }

        node.on("input", Input);
    } // FireStoreNode


    RED.nodes.registerType(NODE_TYPE, FireStoreNode);
};