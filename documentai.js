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
 */
/* jshint esversion: 8 */
const util = require('util');


// Remove all trailing newlines.
function removeTrailingNewlines(text) {
    //return text.replace(/\n+$/, "")
    // Javascript trim includes whitespace which includes trailing newlines
    return text.trim();
}

module.exports = function(RED) {
    "use strict";

    const NODE_TYPE = "google-cloud-documentai";

    // In order to use DocumentAI we need to bring in the DocumentAI libraries.  At the time of writing
    // (2021-02), the package was beta.
    const {
        DocumentProcessorServiceClient,
    } = require('@google-cloud/documentai').v1beta3;

    /**
     * Called when a new instance of the node is created.
     * @param {*} config 
     */
    function DocumentAINode(config) {
        // The config contains the properties defined in the default object in the HTML or modified through configuration in the editor.
        //

        RED.nodes.createNode(this, config);  // Required by the Node-RED spec.

        const node = this;

        let credentials = null;
        if (config.account) {
            credentials = GetCredentials(config.account);
        }
        const keyFilename = config.keyFilename;
        const projectId   = config.projectId;
        const location    = config.location;
        const processorId = config.processorId;
        const mimeType    = config.mimeType;
        const extractFormFields = config.extractFormFields;

        let documentProcessorServiceClient; // Local

        /**
         * Extract JSON service account key from "google-cloud-credentials" config node.
         */

        function GetCredentials(node) {
            return JSON.parse(RED.nodes.getCredentials(node).account);
        } // GetCredentials


        /**
         * Receive an input message for processing.  The input will contain text that we wish
         * to push through language processing for sentiment analysis.
         * @param {*} msg 
         */
        async function Input(msg, send, done) {
            try {
                if (!msg.payload) {
                    node.error("No data found in msg.payload.");
                    return;
                }
                //node.debug(`ProcessorID: ${processorId}`);
                //const name = `projects/${projectId}/locations/${location}/processors/${processorId}`;
                const name = documentProcessorServiceClient.processorPath(projectId, location, processorId);

                // Determine if there is a value at msg.mimeType.  If there is, use that instead of the one configured.
                let localMimeType = mimeType;
                if (msg.mimeType) {
                    localMimeType = msg.mimeType
                }

                //node.debug(`name: ${name}`);
                const request = {
                    name,
                    "document": {
                        "content": msg.payload,
                        "mimeType": localMimeType
                    }
                };

                // The result is documented here: https://cloud.google.com/document-ai/docs/reference/rest/v1beta3/Document
                const [result] = await documentProcessorServiceClient.processDocument(request);

                msg.payload = result;

                if (extractFormFields) {
                // At this point, we have performed our DocumentAI processing and have a result.  Now comes some bonus activity.
                // We will parse out some of the fields of our data.  We do this by realizing that the data is composed of pages
                // corresponding to the input pages.  Each page can contribute some number of form fields.  Each of the form
                // fields is composed of name and value pairs where the name is the discovered name of the field and the value
                // is the discovered value of the field.  Each name/value pair does NOT contain the actual values but instead
                // contains a start index and end index into the discovered text.

                    const document = result.document;
                    const text = document.text;
                    const formFieldResults = [];  // Array of form fields that we might discover.
                    document.pages.forEach((page) => {
                        page.formFields.forEach((formField, formFieldIndex) => {
                            // formField contains
                            // o nameDetectedLanguages: []
                            // o valueDetectedLanguages: []
                            // o fieldName: {}
                            //   o textAnchor: {}
                            //     o textSegments: []
                            //       o startIndex: NUM
                            //       o endIndex: NUM
                            //   o confidence: NUM
                            //   o boundingPoly: {}
                            // o fieldValue: ...
                            // Process name
                            const currentFormFieldResult = {};
                            
                            //formField.fieldName.textAnchor.textSegments.forEach((textSegment, textSegmentIndex) => {
                            //    let fieldText = text.substring(textSegment.startIndex, textSegment.endIndex);
                            //    node.debug(`N: FFI: ${formFieldIndex}, I: ${textSegmentIndex}, S: ${textSegment.startIndex}, E: ${textSegment.endIndex}, T: \"${fieldText}\"`);
                            //});
                            const firstTextSegment = formField.fieldName.textAnchor.textSegments[0];

                            currentFormFieldResult.name = removeTrailingNewlines(
                                text.substring(firstTextSegment.startIndex, firstTextSegment.endIndex)
                            );

                            // Experimentation shows that the value may not be present.  If no value present, then don't try and extract
                            // nor add the field to our accumulating array at all.
                            if (formField.fieldValue.textAnchor) {
                                //formField.fieldValue.textAnchor.textSegments.forEach((textSegment, textSegmentIndex) => {
                                //    let fieldText = text.substring(textSegment.startIndex, textSegment.endIndex);
                                //    node.debug(`V: FFI: ${formFieldIndex}, I: ${textSegmentIndex}, S: ${textSegment.startIndex}, E: ${textSegment.endIndex}, T: \"${fieldText}\"`);
                                //});
                                const firstTextSegment = formField.fieldValue.textAnchor.textSegments[0];
                                currentFormFieldResult.value = removeTrailingNewlines(
                                    text.substring(firstTextSegment.startIndex, firstTextSegment.endIndex)
                                );

                                formFieldResults.push(currentFormFieldResult);
                            }
                        }); // End of for each form field
                    }); // End of for each page.

                    msg.payload.formFields = formFieldResults;
                    //node.debug(util.inspect(formFieldResults));
                }

                node.send(msg);
            } catch(ex) {
                if (done) {
                    done(ex);
                }
                else
                {
                    node.err(ex, msg);
                }
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
            documentProcessorServiceClient = new DocumentProcessorServiceClient({
                "credentials": credentials
            });
        } else if (keyFilename) {
            documentProcessorServiceClient = new DocumentProcessorServiceClient({
                "keyFilename": keyFilename
            });
        } else {
            documentProcessorServiceClient = new DocumentProcessorServiceClient({});
        }

        node.on("input", Input);
        node.on("close", Close);
    } // AutoMLNode

    RED.nodes.registerType(NODE_TYPE, DocumentAINode); // Register the node.

}; // End of export.