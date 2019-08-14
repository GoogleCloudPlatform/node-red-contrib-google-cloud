/* jshint node: true */
/*
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
* We expect to find
* msg.filename - Either this or msg.payload.
* msg.payload - Optional if msg.filename supplied.
*
*/


module.exports = function(RED) {
    "use strict";
    const NODE_TYPE = "google-cloud-vision";
    const vision = require("@google-cloud/vision");

    function VisionNode(config) {

        /**
         * Extract JSON service account key from "google-cloud-credentials" config node.
         */
        function GetCredentials(node) {
            return JSON.parse(RED.nodes.getCredentials(node).account);
        } // GetCredentials


        RED.nodes.createNode(this, config);
        const node = this;

        let credentials = null;
        if (config.account) {
            credentials = GetCredentials(config.account);
        }
        const keyFilename = config.keyFilename;

        let imageAnnotatorClient;

        const isFaceDetection = config.faceDetection;
        const isLandmarkDetection = config.landmarkDetection;
        const isLogoDetection = config.logoDetection;
        const isLabelDetection = config.labelDetection;
        const isTextDetection = config.textDetection;
        const isDocumentTextDetection = config.documentTextDetection;
        const isSafeSearchDetection = config.safeSearchDetection;
        const isImageProperties = config.imageProperties;
        const isCropHints = config.cropHints;
        const isWebDetection = config.webDetection;
        const isProductSearch = config.productSearch;
        const isObjectLocalization = config.objectLocalization;


        /**
         * Get the features that we wish to detect in the image.
         */
        function getFeatures() {
            const features = [];
            if (isFaceDetection) {
                features.push({type: "FACE_DETECTION"});
            }
            if (isLandmarkDetection) {
                features.push({type: "LANDMARK_DETECTION"});
            }
            if (isLogoDetection) {
                features.push({type: "LOGO_DETECTION"});
            }
            if (isLabelDetection) {
                features.push({type: "LABEL_DETECTION"});
            }
            if (isTextDetection) {
                features.push({type: "TEXT_DETECTION"});
            }
            if (isDocumentTextDetection) {
                features.push({type: "DOCUMENT_TEXT_DETECTION"});
            }
            if (isSafeSearchDetection) {
                features.push({type: "SAFE_SEARCH_DETECTION"});
            }
            if (isImageProperties) {
                features.push({type: "IMAGE_PROPERTIES"});
            }
            if (isCropHints) {
                features.push({type: "CROP_HINTS"});
            }
            if (isWebDetection) {
                features.push({type: "WEB_DETECTION"});
            }
            if (isProductSearch) {
                features.push({type: "PRODUCT_SEARCH"});
            }
            if (isObjectLocalization) {
                features.push({type: "OBJECT_LOCALIZAITION"});
            }
            return features;
        } // GetFeatures


        async function Input(msg) {

            if (!msg.filename) {                                     // Check that a file name was provided.
                node.error("No file name supplied");
                return;
            }

            const features = getFeatures();                          // Get the features that the user has asked for from the image.
            if (features.length === 0) {                             // If no features requested, this is an error.
                node.error("No features selected!");
                return;
            }

            const request = {
                features: features
            };

            // The image should contain EITHER content or source.
            // If msg.filename supplied, use that otherwise ... If msg.payload exist and is a Buffer, use that.
            if (msg.filename) {
                request.image = {
                    source: {
                        imageUri: msg.filename
                    }
                };
            } else {
                if (msg.payload && msg.payload instanceof Buffer) {
                    request.image = {
                        content: msg.payload
                    };
                } else {
                    // No msg.filename and msg.payload is not a buffer.
                    node.error("Neither msg.filename nor msg.payload properly supplied.");
                    return;
                }
            }

            try {
                const [response] = await imageAnnotatorClient.annotateImage(request);

                msg.payload = response;
                node.send(msg);
            } catch(err) {
                node.error(err);
            }
        } // Input

        // We must have EITHER credentials or a keyFilename.  If neither are supplied, that
        // is an error.  If both are supplied, then credentials will be used.
        if (credentials) {
            imageAnnotatorClient = new vision.ImageAnnotatorClient({
                "credentials": credentials
            });
        } else if (keyFilename) {
            imageAnnotatorClient = new vision.ImageAnnotatorClient({
                "keyFilename": keyFilename
            });
        } else {
            node.error('Missing credentials or keyFilename.');
            return;
        }

        node.on("input", Input); // Register the handler to be invoked when a new message is to be processed.

    } // VisionNode

    RED.nodes.registerType(NODE_TYPE, VisionNode);
};