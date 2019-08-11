#!/bin/bash
# Read messages from the file sample_messages and write each one
# to the Stackdriver log called my-log.  We can then use this
# as a metric for testing triggers.
#

while read -r line;
do
    echo $line
    gcloud logging write my-log "$line"
done < sample_messages