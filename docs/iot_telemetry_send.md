# IoT Telemetry Send

![IoT Telemetry Send](images/iot_telemetry_send.png)

The GCP IoT Core allows one to send messages from the device to the Cloud.  The transmission can occur over either TCP/IP or MQTT.

In order to send telemetry to the cloud, we need to identify that device. The properties to identify it are the combination of:

* project id - The project hosting the registry.
* region - The region in which the registry is defined.
* registry id - The identity of the registry.
* device id - The identity of the device.

The device must also authenticate itself and needs to be supplied a private key corresponding to the public key associated with the device in the registry.

The msg.payload field is the content that is sent as telemetry.