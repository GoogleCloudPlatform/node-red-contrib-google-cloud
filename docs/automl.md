# AutoML
The GCP AutoML service allows us to train custom models and then run predictions against them.  The Node-RED AutoML node allows us to execute a prediction request.  It encapsulates the predict API documented [here](https://cloud.google.com/automl/docs/reference/rest/v1/projects.locations.models/predict).  On execution the `msg.payload`
is expected to have child nodes of:

* msg.payload.payload
* msg.payload.params (optional)

corresponding to the payload and params data requested by the underlying GCP API.  The response is found in `msg.payload`.

The configuration of the node requires:

* `Project` - The project containing the model.
* `Location` - The region containing the model.
* `Model ID` - The API key for the model (usually TCN…..).