ROOT=$(shell pwd)/..

#
# Add the GCP node to the local installation
#
add:
	echo $(ROOT)
	cd ~/.node-red; npm install $(ROOT)

clean:
	rm -rf $(ROOT)/node_modules
	rm -rf $(ROOT)/package-log.json
