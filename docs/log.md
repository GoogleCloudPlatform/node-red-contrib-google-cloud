# Log

![Log](images/log_node.png)

This node writes a new log entry to a Stackdriver log.

A configuration property specifies the name of the log into which the message will be written but this can be overridden at runtime.

When invoked, the `msg.payload` is written to the log.  The run-time property of `msg.logName` can be used to override the target log defined in the configuration.