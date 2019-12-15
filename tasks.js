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
 *
 * The configuration for the node includes:
 *
 * * account
 * * keyFilename
 * * projectId
 * * location
 * * queue
 * * url
 */
/* jshint esversion: 8 */
module.exports = function(RED) {
    "use strict";
    const NODE_TYPE = "google-cloud-tasks";
    const {v2beta3} = require("@google-cloud/tasks");
    const cloudTasks = v2beta3;


    function TasksNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        let credentials = null;
        if (config.account) {
            credentials = GetCredentials(config.account);
        }
        const keyFilename = config.keyFilename;

        const projectId   = config.projectId;
        const location    = config.location;
        const queue       = config.queue;
        const url         = config.url;

        let tasksClient;

        /**
         * Extract JSON service account key from "google-cloud-credentials" config node.
         */
        
        function GetCredentials(node) {
            return JSON.parse(RED.nodes.getCredentials(node).account);
        }

        async function Input(msg) {
            const parent = tasksClient.queuePath(projectId, location, queue);
            const task = {
                "httpRequest": {
                    "httpMethod": "POST",
                    "url": url
                }
            };
            if (msg.payload) {
                if (msg.payload instanceof String || typeof(msg.payload) == "string") {
                    task.httpRequest.body = Buffer.from(msg.payload).toString("base64");
                } else if (msg.payload instanceof Buffer) {
                    task.httpRequest.body = msg.payload.toString("base64");
                } else {
                    node.error('Expected payload to be string or Buffer');
                    return;
                }
            }


            if (msg.scheduleTime) {  // If the input message has a field called scheduleTime then use that as the time of schedule.
                let scheduleTimeDate;
                if (msg.scheduleTime instanceof String || typeof(msg.scheduleTime) == "string") {
                    scheduleTimeDate = new Date(msg.scheduleTime);
                } else if (msg.scheduleTime instanceof Date) {
                    scheduleTimeDate = msg.scheduleTime;
                } else {
                    node.error('Expected scheduleTime to be a string or Date');
                    return;
                }
                
                task.scheduleTime = {
                    seconds: scheduleTimeDate.getTime()/1000,
                    nanos: 0
                };
            }

            const request = {
                "parent": parent,
                "task": task
            };
            const [response] = await tasksClient.createTask(request);
        } // Input


        // We must have EITHER credentials or a keyFilename.  If neither are supplied, that
        // is an error.  If both are supplied, then credentials will be used.
        if (credentials) {
            tasksClient = new cloudTasks.CloudTasksClient({
                "credentials": credentials
            });
        } else if (keyFilename) {
            tasksClient = new cloudTasks.CloudTasksClient({
                "keyFilename": keyFilename
            });
        } else {
            tasksClient = new cloudTasks.CloudTasksClient({});
        }

        node.on("input", Input);
    } // TasksNode


    RED.nodes.registerType(NODE_TYPE, TasksNode);
};