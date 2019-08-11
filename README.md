node-red-contrib-google-cloud **(BETA)**
=====================================

**_This is not an official Google product._**

[Node-RED](http://nodered.org) nodes for [Google Cloud Platform](https://cloud.google.com/).

Node-RED is an open source project which provides a visual programming environment and runtime for execution of event based applications.  Written in Node.js
JavaScript, it executes on a wide variety of platforms including workstations, IoT devices and, most importantly for our discussion, on Google Cloud Platform
environments which includes Compute Engines and Kubernetes.

The Node-RED story is based on discrete *nodes* of function which are dragged and dropped from a palette to a canvas and then wired together.  This
resulting flow of execution is then triggered by the arrival of external events including REST requests, Pub/Sub messages, timers and more.

One of the key reasons that Node-RED has become as popular as it has is the ease with which developers can build additional nodes that encapsulate rich
sets functions.  Once written, these add-on nodes can be used by flow writers without having to know the complexities of their underlying operation.  One just drags 
a new node onto the canvas and uses it.

This project provides a set of core Google Cloud Platform oriented Node-RED nodes.  Once installed, the capability to use a broad set of GCP services are immediately unlocked.

## Installation

There are multiple ways to install `node-red-contrib-google-cloud`. The official ways are described in the Node-RED [documentation](https://nodered.org/docs/getting-started/adding-nodes).  The name of the package for installation is `node-red-contrib-google-cloud`.

## Google Cloud Credentials

Each of the nodes made available through this package will communicate with GCP.  These interactions must be performed securely and require
credentials to be passed.  This package allows us to define one or more sets of credentials as named entities that can then be referenced
within each of the nodes that request service.

| Property    | Type     | Description                                          |
| ----------- | -------- | ---------------------------------------------------- |
| **name**    | `string` | Label for easy identification, essentially a comment. |
| **account** | `string` | Credentials in the form of a JSON key.               |

The credentials for a service account can be acquired from the [APIs & Services](https://console.cloud.google.com/apis/credentials) menu. After you finish creating a service account key, it will be downloaded in JSON format and saved to a local file.
Copy and paste the contents of the file directly into the **Key** field in the node editor.

![Step 1](docs/images/credentials1.png)

![Step 2](docs/images/credentials2.png)

![Step 3](docs/images/credentials3.png)

## The Google Cloud Platform Node-RED nodes

The set of Node-RED nodes are found in the GCP section of the palette.  The current set of nodes are:

* [PubSub In](docs/pubsub_in.md) - Receive a published message.
* [PubSub Out](docs/pubsub_out.md) - Publish a new message.
* [Google Cloud Store Read](docs/gcs_read.md) - Read from the object store.
* [Google Cloud Store Write](docs/gcs_write.md) - Write to the object store.
* [Log](docs/log.md) - Write an entry to Stackdriver logging.
* [Tasks](docs/tasks.md) - Create a new Cloud Task instance.
* [Sentiment](docs/sentiment.md) - Perform Natural Language Analytics on a piece of text.
* [Vision](docs/vision.md) - Analyse an image.
* [Metadata](docs/metadata.md) - Retrieve the compute engine metadata.
* [Monitoring](docs/monitoring.md) - Write a new monitoring record.

We are very open to receiving feedback on additional GCP nodes that may be of value.  Don't hesitate to open an issue should you have a desire
for incorporating additional GCP functions.