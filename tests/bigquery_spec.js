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
 */
/* jshint esversion: 8 */
const should = require("should");
const helper = require('node-red-node-test-helper');
const bigQueryNode = require('../bigquery.js');

helper.init(require.resolve('node-red'));

describe('BigQuery Node', function() {

    beforeEach((done) => {
        helper.startServer(done);
    });

    afterEach((done)=> {
        helper.unload();
        helper.stopServer(done);
    });


    it('Query from static configured query', function(done) {
        const flow = [
            {
                "id": "n1",
                "type": "google-cloud-bigquery",
                "keyFilename": "/home/kolban/node-red/creds.json",
                "projectId": "kolban-test",
                "query": "select id, tags from `bigquery-public-data.stackoverflow.posts_questions` limit 10",
                "list": false,
                "wires": [["n2"]]
            },
            {
                "id": "n2",
                "type": "helper"
            }
        ];
        helper.load(bigQueryNode, flow, () => {
            // At this point the flow is "running".  We now need to send in some data.
            const n1 = helper.getNode("n1");
            const n2 = helper.getNode("n2");
            n2.on('input', (msg) => {
                // console.log(JSON.stringify(msg.payload));
                if (msg.payload.length == 10) { // We expect to get 10 results back
                    done();
                }
            });
            n1.receive({
                "payload": null
            });
        });
    }); // Query from static configured query

    it('Query from payload configured query', function(done) {
        const flow = [
            {
                "id": "n1",
                "type": "google-cloud-bigquery",
                "keyFilename": "/home/kolban/node-red/creds.json",
                "projectId": "kolban-test",
                "query": "",
                "list": false,
                "wires": [["n2"]]
            },
            {
                "id": "n2",
                "type": "helper"
            }
        ];
        helper.load(bigQueryNode, flow, () => {
            // At this point the flow is "running".  We now need to send in some data.
            const n1 = helper.getNode("n1");
            const n2 = helper.getNode("n2");
            n2.on('input', (msg) => {
                //console.log(JSON.stringify(msg.payload));
                if (msg.payload.length == 10) { // We expect to get 10 results back
                    done();
                }
            });
            n1.receive({
                "payload": "select id, tags from `bigquery-public-data.stackoverflow.posts_questions` limit 10"
            });
        });
    }); // Query from payload configured query

});

/*

[
    {
        "id": "3403bd1a.281682",
        "type": "tab",
        "label": "Flow 3",
        "disabled": false,
        "info": ""
    },
    {
        "id": "9e5ff87c.5da638",
        "type": "google-cloud-bigquery",
        "z": "3403bd1a.281682",
        "account": "",
        "keyFilename": "",
        "projectId": "kolban-test",
        "query": "select id, tags from `bigquery-public-data.stackoverflow.posts_questions`\nlimit 10",
        "x": 540,
        "y": 360,
        "wires": [
            [
                "97f42756.6e2958"
            ]
        ],
        "info": "Perform a query using the query string provided in the configuration."
    },
    {
        "id": "a2a8cfbc.19391",
        "type": "inject",
        "z": "3403bd1a.281682",
        "name": "",
        "topic": "",
        "payload": "",
        "payloadType": "str",
        "repeat": "",
        "crontab": "",
        "once": false,
        "onceDelay": 0.1,
        "x": 390,
        "y": 360,
        "wires": [
            [
                "9e5ff87c.5da638"
            ]
        ],
        "info": "Start a flow to query the database."
    },
    {
        "id": "97f42756.6e2958",
        "type": "debug",
        "z": "3403bd1a.281682",
        "name": "",
        "active": true,
        "tosidebar": true,
        "console": false,
        "tostatus": false,
        "complete": "payload",
        "targetType": "msg",
        "x": 710,
        "y": 360,
        "wires": [],
        "info": "Log the results to the debug output."
    },
]

*/
