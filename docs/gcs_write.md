# Google Cloud Storage Write

![GCS Write](images/gcs_write_node.png)

This node writes the content of the payload to a GCS object. 

On execution, the data contained in msg.payload is written into the file specified by msg.filename.  The format of this field is a GCS Url of the form `gs://[BUCKET]/[FILE]`.  An optional field called msg.contentType contains the MIME type to be associated with the file.