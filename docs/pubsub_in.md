# PubSub In

![PubSub In](images/pubsub_in_node.png)

This node receives a message that has been published to a topic.  During configuration, the property called `Subscription` is used to name the GCP Subscription that we are watching.

This is an event generating node and as such has no inputs.  When a message is received, the flowing msg will contain a payload property corresponding to a GCP PubSub message.  This is described [here](https://cloud.google.com/nodejs/docs/reference/pubsub/0.28.x/Message).  The message is auto acknowledged.