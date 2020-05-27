# IoT Send Command

![IoT Send Command](images/iot_command_send.png)

The GCP IoT Core allows one to send a command to a connected IoT device.  The IoT - Send Command node encapsulates this function.  In order to send a command to an IoT device, we need to identify that device.  The properties to identify it are the combination of:

* project id - The project hosting the registry.
* region - The region in which the registry is defined.
* registry id - The identity of the registry.
* device id - The identity of the device.

With those defined, we can then send a payload.  To use this node, each of these must be supplied.  We can supply values statically through the node's specific configuration or dynamically in the incoming message.  For a dynamic invocation, we supply:

* msg.gcp.projectId
* msg.gcp.region
* msg.gcp.registryId
* msg.gcp.deviceId

For the projectId and region, if one or both of those are not found, then we test to see if Node-RED is itself running on GCP and use the values retrieved from the compute engine metadata.
The content of the send command that is sent to the device will be retrieved from msg.payload.