# BigQuery
![BigQuery Node](images/nigquery_node.png)

The BigQuery node provides an interface to the BigQuery data warehouse.  It has configuration parameters which include the query to run and the name of the project to bill for usage.

When executed, if a query string is provided, that fixed string will be used.  If no query string is provided, then `msg.payload` is expected to be a string which will then be used as the query to execute.

On return, an array of rows will be saved in `msg.payload`.