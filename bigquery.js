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
 *
 */
/* jshint esversion: 8 */
module.exports = function(RED) {
    "use strict";
    const NODE_TYPE = "google-cloud-bigquery";
    const {BigQuery} = require('@google-cloud/bigquery');



    function BigQueryNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        const staticQuery = config.query;
        let projectId = config.projectId;
        if (!projectId || projectId.trim().length == 0) {
            projectId = null;
        }
        let bigquery = null;

        let credentials = null;
        if (config.account) {
            try {
                credentials = GetCredentials(config.account);
            }
            catch(error) {
                node.error('Unable to retrieve credentials, please check account details');
                return;
            }
        }
        const keyFilename = config.keyFilename;

        /**
         * Extract JSON service account key from "google-cloud-credentials" config node.
         */
        
        function GetCredentials(node) {
            return JSON.parse(RED.nodes.getCredentials(node).account);
        }


        // Called when a message arrives at the node.
        async function Input(msg) {
            // We need to determine the query to run.
            let query;
            // If we have a staticQuery, use that
            if (staticQuery != null && staticQuery.trim().length > 0) {
                query = staticQuery;
            } else {
                // We have no static query, check that we have a msg.payload
                if (msg.hasOwnProperty('payload')) {
                    // We have a msg.payload, make sure it is a string.
                    if ((typeof msg.payload === 'string' || msg.payload instanceof String) && msg.payload.trim().length > 0) {
                        query = msg.payload;
                    } else {
                        node.error('No static query and no string msg.payload to use as a query.');
                        return;
                    }
                } else {
                    node.error('No query found to execute.');
                    return;
                }
            } 

            // We do not have a static query
            try {
                const results = await bigquery.query(query);
            }
            catch(error) {
                node.error('Error, unable to execute query.');
                return;
            }
            
            msg.payload = results[0];
            node.send(msg);
        } // Input

        if (credentials) {
            bigquery = new BigQuery({
                "projectId": projectId,
                "credentials": credentials,
                "scopes": ["https://www.googleapis.com/auth/drive.readonly"]
            });
        } else if (keyFilename) {
            bigquery =  new BigQuery({
                "projectId": projectId,
                "keyFilename": keyFilename,
                "scopes": ["https://www.googleapis.com/auth/drive.readonly"]
            });
        } else {
            bigquery =  new BigQuery({
                "projectId": projectId,
                "scopes": ["https://www.googleapis.com/auth/drive.readonly"]
            });
        }

        node.on("input", Input);
    } // BigQueryNode


    RED.nodes.registerType(NODE_TYPE, BigQueryNode);
};