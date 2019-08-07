/**
 * The configuration for the node includes:
 * * account
 * * projectId
 * * location
 * * queue
 * * url
 */
module.exports = function(RED) {
    "use strict";
    const NODE_TYPE = "google-cloud-tasks";
    const {v2beta3} = require("@google-cloud/tasks");
    const cloudTasks = v2beta3;


    function TasksNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        const credentials = GetCredentials(config.account);
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
                    node.error("Expected payload to be string or Buffer");
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
                    node.error("Expected scheduleTime to be a string or Date");
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

        node.on("input", Input);

        if (credentials) {
            tasksClient = new cloudTasks.CloudTasksClient({
                "credentials": credentials
            });
        } else {
            node.error("missing credentials");
        }
    } // TasksNode



    RED.nodes.registerType(NODE_TYPE, TasksNode);
};