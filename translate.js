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
 * contains the original data that may contain sensitive data.
 * 
 * The configuration for the node includes:
 *
 */
/* jshint esversion: 8 */

//@ts-check

module.exports = function (RED) {
    "use strict";
    const NODE_TYPE = "google-cloud-translate";
    const translate = require('@google-cloud/translate');
    let translationServiceClient;

    function TranslateNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        const context = node.context();
        const projectId = config.projectId;
        const sourceLanguageCodeType = config.sourceLanguageCodeType || "str";
        const targetLanguageCodeType = config.targetLanguageCodeType || "str";
        const outputFormat = config.outputFormat || "full";
        const displayLanguageCode = Intl.DateTimeFormat().resolvedOptions().locale || "en";

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

        /**
         * Get supported languages from global context. If not found, load from Google Could Translate and store in global context.
         *
         * @returns List of supported languages for translation
         */
        async function getSupportedLanguages() {
            let supportedLanguages = context.global.get("google-cloud-translate-languages");

            if (!supportedLanguages) {
                const request = {
                    "displayLanguageCode": displayLanguageCode,
                    "parent": translationServiceClient.locationPath(projectId, "global")
                };
                supportedLanguages = (await translationServiceClient.getSupportedLanguages(request)[0]).languages;
                context.global.set("google-cloud-translate-languages", supportedLanguages);
            }

            return supportedLanguages;
        }

        /**
         * Gets the language codes for the specified languages
         * 
         * @param {string[]} languages
         */
        async function getLanguageCodes(...languages) {
            let supportedLanguages = await getSupportedLanguages();
            return languages.map(language =>
                language &&
                supportedLanguages
                    .find(availableLanguage =>
                        availableLanguage.languageCode === language
                        || availableLanguage.displayName === language
                        || availableLanguage.displayName.startsWith(language)
                    )
                || { languageCode: language }
            ).map(l => l.languageCode);
        }

        /**
         * Called when a message arrives at the node.
         * 
         * @param {{ payload: any; }} msg
         */
        async function Input(msg) {
            const [sourceLanguageCode, targetLanguageCode] = await getLanguageCodes(
                RED.util.evaluateNodeProperty(
                    config.sourceLanguageCode,
                    sourceLanguageCodeType,
                    node,
                    msg
                ) || "",
                RED.util.evaluateNodeProperty(
                    config.targetLanguageCode,
                    targetLanguageCodeType,
                    node,
                    msg
                ),
            );
            const request = {
                "contents": [msg.payload],
                "sourceLanguageCode": sourceLanguageCode,
                "targetLanguageCode": targetLanguageCode,
                "mimeType": "text/plain",
                "parent": translationServiceClient.locationPath(projectId, "global")
            };
            try {
                const [response] = await translationServiceClient.translateText(request);
                msg.payload = outputFormat === "full"
                    ? response
                    : response.translations[0].translatedText;
                node.send(msg);
            }
            catch (e) {
                node.error(e, msg);
            }
        } // Input


        // We must have EITHER credentials or a keyFilename.  If neither are supplied, that
        // is an error.  If both are supplied, then credentials will be used.
        if (credentials) {
            translationServiceClient = new translate.v3beta1.TranslationServiceClient({
                "credentials": credentials
            });
        } else if (keyFilename) {
            translationServiceClient = new translate.v3beta1.TranslationServiceClient({
                "keyFilename": keyFilename
            });
        } else {
            translationServiceClient = new translate.v3beta1.TranslationServiceClient({});
        }

        node.on("input", Input);
    } // TranslateNode


    RED.nodes.registerType(NODE_TYPE, TranslateNode);
};