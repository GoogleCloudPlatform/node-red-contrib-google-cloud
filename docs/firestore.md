# Firestore
![Firestore Node](images/firestore_node.png)

The Firestore node provides an interface to the Firestore database.  The following core operations have been exposed:

* `get` - Get the content of a document.
* `set` - Set the content of a document.
* `update` - Change the content of a document leaving some fields unchanged.
* `delete` - Delete a document.
* `query` - Query for and return a set of documents matching a search.

The configuration parameters of the node include the Project Id to be used for billing.

Another configuration parameter is the operation to perform.  The operation is selected from the pull-down and is one of the allowed operations.

On input, msg.payload must contain an object with certain values that are dependent on the operation chosen.

|Property|Operations|Description|
|--------|----------|-----------|
|path|set, get, update, delete, query|The path to the document to be set, get, updated or deleted.  For a query, this is the path to the collection to be examined.
|content|set, update|The content of the document to be set/updated.|
|query|query|The query to be performed.  This can either be a single object or an array of objects.  The object(s) contain: fieldPath - The field in the document to be examined. opStr - The expression operation.  eg. "==" value - The value to be used in the expression.|

On return, the get/query operations return the content of the found documents.  For "get" it is a single object while for "query" it is an array of objects.