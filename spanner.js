/**
 * Copyright 2021 Google Inc.
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
    const NODE_TYPE = "google-cloud-spanner";
    const {Spanner} = require('@google-cloud/spanner');



    function SpannerNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;


        //let projectId = config.projectId;
        //if (!projectId || projectId.trim().length == 0) {
        //    projectId = null;
        //}

        let spanner = null;

        let credentials = null;
        if (config.account) {
            credentials = GetCredentials(config.account);
        }
        const keyFilename = config.keyFilename;

        if (!config.instanceId) {
            node.error('Instance ID is required');
            return;
        }
        if (!config.databaseId) {
            node.error('Database ID is required');
            return;
        }
        const instanceId   = config.instanceId;
        const databaseId   = config.databaseId;
        const staticSqlStatement = config.sqlStatement;

        /**
         * Extract JSON service account key from "google-cloud-credentials" config node.
         */
        
        function GetCredentials(node) {
            return JSON.parse(RED.nodes.getCredentials(node).account);
        }

        // Called when a message arrives at the node.
        async function Input(msg) {
            // We need to determine the query to run.
            let sqlStatement;
            // If we have a staticQuery, use that
            if (staticSqlStatement != null && staticSqlStatement.trim().length > 0) {
                sqlStatement = staticSqlStatement;
            } else {
                // We have no static query, check that we have a msg.payload
                if (msg.hasOwnProperty('payload')) {
                    // We have a msg.payload, make sure it is a string.
                    if ((typeof msg.payload === 'string' || msg.payload instanceof String) && msg.payload.trim().length > 0) {
                        sqlStatement = msg.payload;
                    } else {
                        node.error('No static query and no string msg.payload to use as a SQL statement.');
                        return;
                    }
                } else {
                    node.error('No SQL statement found to execute.');
                    return;
                }
            } // We do no have a static SQL statement

            // Execute the Spanner api to run the SQL statement
            const [rows] = await database.run(sqlStatement);
            msg.payload = rows;
            node.send(msg);
        } // Input

        if (credentials) {
            // See: https://googleapis.dev/nodejs/spanner/latest/v1.SpannerClient.html
            spanner = new Spanner({
                //"projectId": projectId,
                "credentials": credentials
            });
        } else if (keyFilename) {
            spanner =  new Spanner({
                //"projectId": projectId,
                "keyFilename": keyFilename
            });
        } else {
            spanner =  new Spanner({
                //"projectId": projectId
            });
        }
        const instance = spanner.instance(instanceId);
        const database = instance.database(databaseId);
        node.on("input", Input);
    } // SpannerNode


    RED.nodes.registerType(NODE_TYPE, SpannerNode);
};