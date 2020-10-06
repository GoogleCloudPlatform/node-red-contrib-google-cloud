# Google Cloud Storage Signed URL

![GCS ](images/gcs_signedURL_node.png)

This node generates the signed URL of a Google Cloud Store (GCS) object with action (READ/WRITE) and expiration time in mins .It returns the URL in the `msg.payload` field.

At runtime, the value of msg.filename contains describes the file to read.  The format of this field is a GCS Url of the form `gs://[BUCKET]/[FILE]`. 
Alternatively, we can specify the file to be read in the file name configuration property.  If both this property and a runtime value found in `msg.filename` are present, then the `msg.filename` name will be used.

Action supoorted by this Node are 
1. Read
2. Write

While trying to write a file using SignedURL, Always specify the `Content-Type : application/octet-stream` in the headers of the PUT request to avoid signature mismatch errors

Expiration time for this signed URL is default to 15 mins and can be set from 1 min and above
