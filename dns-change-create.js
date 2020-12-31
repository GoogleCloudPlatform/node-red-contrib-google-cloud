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
    const NODE_TYPE = "google-cloud-dns-change-create";
    const {DNS, Record} = require('@google-cloud/dns');

    function DnsChangeCreateNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        let dnsOptions = {
            projectId: config.projectId,
        };
        if (config.account) {
            dnsOptions.credentials = JSON.parse(RED.nodes.getCredentials(node).account);
        } else if (config.keyFilename) {
            dnsOptions.keyFilename = config.keyFilename;
        }
        const dns = new DNS(dnsOptions);
        const zone = dns.zone(config.managedZone);

        // Converts an (easy to construct in node-red) object representation of
        // https://cloud.google.com/dns/docs/reference/v1/resourceRecordSets#resource
        // into a Record from the DNS library.
        function toRecord(resourceRecordSet) {
            return new Record(
                config.managedZone,
                resourceRecordSet.type,
                {
                    name: resourceRecordSet.name,
                    data: resourceRecordSet.rrdatas,
                    ttl: resourceRecordSet.ttl,
                    type: resourceRecordSet.type || "",
                    signatureRrdatas: resourceRecordSet.signatureRrdatas || [],
                });
        }

        // Called when a message arrives at the node.
        node.on("input", async function(msg) {
            try {
                msg.payload = await zone.createChange({
                    add: (msg.additions || []).map(toRecord),
                    delete: (msg.deletions || []).map(toRecord),
                });
            } catch (exp) {
                node.error(exp);
                msg.error = exp;
                return;
            }
            node.send(msg);
        });
    }

    RED.nodes.registerType(NODE_TYPE, DnsChangeCreateNode);
};
