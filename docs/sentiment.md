# Sentiment

![Sentiment](images/sentiment_node.png)

This node processes text and performs a sentiment analysis using the Natural Language APIs.  On invocation, it expects a string to be in `msg.payload` which contains the text that will be examined.  On return, the `msg.sentiment` object is filled in with two properties:

* msg.sentiment.score
* msg.sentiment.magnitude
