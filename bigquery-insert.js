/**
 * Copyright 2020 Google Inc.
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
    const NODE_TYPE = "google-cloud-bigquery-insert";
    const {BigQuery} = require('@google-cloud/bigquery');
    const util = require("util");



    function BigQueryInsertNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        let projectId = config.projectId;
        if (!projectId || projectId.trim().length == 0) {
            projectId = null;
        }
        let datasetId = config.datasetId;
        let tableId = config.tableId;
        let bigquery = null;
        let table = null;

        let credentials = null;
        if (config.account) {
            credentials = GetCredentials(config.account);
        }
        const keyFilename = config.keyFilename;

        /**
         * Extract JSON service account key from "google-cloud-credentials" config node.
         */
        
        function GetCredentials(node) {
            return JSON.parse(RED.nodes.getCredentials(node).account);
        }


        // Called when a message arrives at the node.
        async function Input(msg, send, done) {
            try {
                await table.insert(msg.payload);
                node.send(msg);
            }
            catch(ex) {
                // Error messages are encoded in an object that needs expanded
                let res = ex;
                if (ex.response && ex.response.kind && ex.response.kind === "bigquery#tableDataInsertAllResponse") {
                    res = ex.name + ": ";
                    ex.response.insertErrors.forEach((element) => {
                        element.errors.forEach((element2) => {
                            res += `message: ${element2.message}, location: ${element2.location} `;
                        });
                    });
                }
                if (done) {
                    done(res);
                }
                else
                {
                    node.err(res, msg);
                }
            }
        } // Input

        if (credentials) {
            bigquery = new BigQuery({
                "projectId": projectId,
                "credentials": credentials
            });
        } else if (keyFilename) {
            bigquery =  new BigQuery({
                "projectId": projectId,
                "keyFilename": keyFilename
            });
        } else {
            bigquery =  new BigQuery({
                "projectId": projectId
            });
        }
        const dataset = bigquery.dataset(datasetId);
        table =  dataset.table(tableId);

        node.on("input", Input);
    } // BigQueryInsertNode


    RED.nodes.registerType(NODE_TYPE, BigQueryInsertNode);
};