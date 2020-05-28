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

Each of the new nodes made available through this package will communicate with the Google Cloud Platform (GCP).  These interactions must be performed securely and require authentication information to be passed.

If Node-RED is running under a GCP environment such as a Compute Engine, Google Kubernetes Engine or Cloud Run then there is an implicit identity presented
to GCP and the flow developer need do nothing special for authentication configuration.  However, if your Node-RED runtime is not running
under GCP or you wish to call a service with adistinct identity, then you will need to use explicit credentials.

On each node, we have the opportunity to supply credentials.  These can be supplied either as a path to a named key file or by creating a Node-RED managed name credentials secret.  Each credential defined as a Node-RED secret has the following properties:


| Property    | Type     | Description                                          |
| ----------- | -------- | ---------------------------------------------------- |
| **name**    | `string` | Label for easy identification, essentially a comment. |
| **account** | `string` | Credentials in the form of a JSON key.               |

The credentials for a service account can be acquired from the [APIs & Services](https://console.cloud.google.com/apis/credentials) menu. After you finish creating a service account key, it will be downloaded in JSON format and saved to a local file.
Copy and paste the contents of the file directly into the **Key** field in the node editor.

![Step 1](docs/images/credentials1.png)

![Step 2](docs/images/credentials2.png)

![Step 3](docs/images/credentials3.png)

An alternative to supplying credentials through the  Node-RED credentials mechanism is to point individual GCP nodes to a JSON key file that exists on the file system on which Node-RED is running.  This capability was introduced to support the Kubernetes "secrets" architecture.  A Kubernetes administrator could obtain a JSON key file and save that as a secret in the Kubernetes environment.  Containers within the environment could then see the secrets as mounted files.  This level of indirection and abstraction allows us to build images which don't contain the keys hard-coded into the images but yet make those keys available at run-time.  In addition, if we need to change or rotate the keys, we can do so without having to rebuild any images.

## Installation outside of GCP

When we run Node-RED on GCP compute resources such as Compute Engine or GKE, the environment to make GCP API service calls is already present.  If we run Node-RED outside of GCP (for example on a desktop PC, an on-premises server or a Raspberry Pi) then some additional setup to connect and use GCP APIs is required.  Specifically, an environment variable called `GOOGLE_CLOUD_PROJECT` must be set and be present in the environment in which Node-RED runs.  The value of this variable should be the GCP project that you are going to interact with.

If you are running Node-RED from the command line, you can use:

```
export GOOGLE_CLOUD_PROJECT=<YourProjectId>
node-red
```

You can also permanently set the variable by editing `/etc/environment` and adding a line which reads:

```
GOOGLE_CLOUD_PROJECT=<YourProjectId>
```

Note: For Raspberry Pi users - There is the option of starting Node-RED automatically through the Linux systemctl daemon.  This system does not use global environment variables and thus you must explicitly define the variable to use.

Edit the file `/lib/systemd/system/nodered.service`

and add a line which reads:

```
Environment="GOOGLE_CLOUD_PROJECT=<YourProjectId>"
```

within the `[Service]` section of the file.


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
* [Speech to Text](docs/speech_to_text.md) - Recognize speech from audio.
* [Data loss prevention](docs/dlp.md) - Mask out identifiable information.
* [Translation](docs/translate.md) - Translate text from one language to another.
* [BigQuery](docs/bigquery.md) - Execute a BigQuery query.
* [BigQuery Insert](docs/bigquery-insert.md) - Execute a BigQuery insert.
* [IoT Command Send](docs/iot_send_command.md) - Send an IoT command to a device.
* [IoT Config Update](docs/iot_update_config.md) - Update the config of an IoT device.
* [IoT Telemetry Send](docs/iot_telemetry_send.md) - Send a telemetry message from a device.

We are very open to receiving feedback on additional GCP nodes that may be of value.  Don't hesitate to open an issue should you have a desire
for incorporating additional GCP functions.