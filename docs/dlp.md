# Data Loss Prevention
![DLP Node](images/dlp_node.png)

The DLP node takes as input a piece of text and performs Data Loss Prevention (DLP) processing against it.  The result is the original text with information de-identified.  The items to be scanned are provided in a template that must be configured from the GCP console.

The input to the node is a text string found in `msg.payload`.  The output from the node is an object that conforms to the transformation described [here](https://googleapis.dev/nodejs/dlp/latest/google.privacy.dlp.v2.html#.DeidentifyContentResponse).  Specifically, `msg.payload.item.value` contains the transformed text.  The de-identification rule applied is the built in primitive transformation called [ReplaceWithInfoTypeConfig](https://googleapis.dev/nodejs/dlp/latest/google.privacy.dlp.v2.html#.ReplaceWithInfoTypeConfig).