# Entities

![Entities](images/entities_node.png)

This node processes text and performs an entity analysis using the Natural Language APIs.  On invocation, it expects a string to be in `msg.payload` which contains the text that will be examined.  On return, the `msg.entities` object is filled in with an array of found entities. Each item in the array has the following properties:

* msg.entities[n].mentions
* msg.entities[n].metadata
* msg.entities[n].name
* msg.entities[n].type
* msg.entities[n].salience
* msg.entities[n].sentiment

See the [Google Cloud docs](https://cloud.google.com/natural-language/docs/reference/rest/v1/Entity) for a complete reference for what these properties represent.

The input text defaults to be English but this can be changed to one of the [supported](https://cloud.google.com/natural-language/docs/languages#sentiment_analysis) languages.