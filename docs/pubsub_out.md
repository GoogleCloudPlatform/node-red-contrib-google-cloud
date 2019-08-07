# PubSub Out

![PubSub Out](images/pubsub_out_node.png)

This node publishes a message to a given topic.  The topic is supplied during configuration in the property called `Topic`.

During invocation, the `msg.payload` will be published as the body of the message.  It should either be a string or a Buffer.