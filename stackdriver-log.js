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
 * The node type is "stackdriver-log".
 */
/* jshint esversion: 8 */
module.exports = function(RED) {
    "use strict";
    const NODE_TYPE = "google-cloud-log";
    const {Logging} = require("@google-cloud/logging");

    /**
     * Called when a new instance of the node is created.
     * @param {*} config 
     */
    function StackdriverLogNode(config) {
        // The config contains the properties defined in the default object in the HTML or modified through configuration in the editor.
        //

        RED.nodes.createNode(this, config);  // Required by the Node-RED spec.

        const node = this;

        let credentials = null;
        if (config.account) {
            credentials = GetCredentials(config.account);
        }

        const keyFilename = config.keyFilename;
        let logName = config.logName; // Get the logname from the configuration
        let logging; // This is the object that is the hook to GCP stackdriver logging.

        /**
         * Extract JSON service account key from "google-cloud-credentials" config node.
         */
        
        function GetCredentials(node) {
            return JSON.parse(RED.nodes.getCredentials(node).account);
        } // GetCredentials

        
        /**
         * Receive an input message for processing.
         * @param {*} msg 
         */
        function Input(msg) {

            node.log("Input called!");

            if (!msg.payload) {  // If there is nothing to log, do nothing.
                return;
            }

            // We have the option of supplying a log name to use in the msg.logName property.  If it exists, we will
            // use that in preference to the logName configured in the configuration of the node.
            let logNameToUse = logName;
            if (msg.logName) {
                logNameToUse = msg.logName;
            }
            
            const log = logging.log(logNameToUse);
            const metadata = {
                resource: {
                    type: "global"
                }
            };
              
            const entry = log.entry(metadata, msg.payload); // Create the log entry to write.
              
            log.write(entry); // Write the log entry.
        } // Input


        /**
         * Cleanup this node.
         */
        function Close() {
        } // Close

        // We must have EITHER credentials or a keyFilename.  If neither are supplied, that
        // is an error.  If both are supplied, then credentials will be used.
        if (credentials) {
            logging = new Logging({
                "credentials": credentials
            });
        } else if (keyFilename) {
            logging = new Logging({
                "keyFilename": keyFilename
            });
        } else {
            logging = new Logging({});
        }

        if (!logName) {
            node.error("No log name supplied");
            return;
        }

        logName = logName.trim(); // Remove any leading or trailing white space.

        node.on("input", Input);
        node.on("close", Close);
    } // StackdriverLogNode

    RED.nodes.registerType(NODE_TYPE, StackdriverLogNode); // Register the node.
};