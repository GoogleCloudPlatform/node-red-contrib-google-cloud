/* jshint esversion: 8 */
const axios = require("axios");

/**
 * Helper function to retrieve data from the GCE metadata servers.
 * @param {*} path Path to the part of the meta data instance desired.  This should be the bit after http://metadata.google.internal/computeMetadata/v1.
 * @returns A proimise that is fulfilled with either null or the value.
 */
async function getMetadata(path) {
    // Make a REST call to get the project id from metadata server.
    // curl --header "Metadata-Flavor: Google" http://metadata.google.internal/computeMetadata/v1/project/project-id
    try {
        let response = await axios({
            url: `http://metadata.google.internal/computeMetadata/v1${path}`,
            method: 'get',
            headers: {
                'Metadata-Flavor': 'Google'
            }
        });
        //console.log(response.data);
        return response.data;
    }
    catch(err) {
        //console.log(err);
        return null;
    }
} // getMetadata


/**
 * Get the project id of the running GCE instance.
 */
function getProjectId() {
    // Make a REST call to get the project id from metadata server.
    // curl --header "Metadata-Flavor: Google" http://metadata.google.internal/computeMetadata/v1/project/project-id
    return getMetadata('/project/project-id');
} // getProjectId


/**
 * Get the zone of the running GCE instance.  
 */
async function getZone() {
    // Make a REST call to get the zone from metadata server.
    // curl --header "Metadata-Flavor: Google" http://metadata.google.internal/computeMetadata/v1/instance/zone
    // This is a string of the format:
    // projects/[NUMERIC_PROJECT_ID]/zones/[ZONE_NAME]
    //
    // For example:
    // projects/726768633380/zones/us-central1-a
    //
    // To get the zone we find the tailing part.
    //
    let metadata = await getMetadata('/instance/zone');
    if (metadata == null) {
        return null;
    }
    let lastIndex = metadata.lastIndexOf('/');
    if (lastIndex == -1) {
        return null;
    }
    return metadata.substring(lastIndex+1);
} // getZone


/**
 * Get the region from a zone.  We convert a zone to a region by stripping off the zone identifier.
 * For example us-central1-a becomes us-central1.
 * @param {*} zone The zone to convert to a region.
 */
function zoneToRegion(zone) {
    let lastIndex = zone.lastIndexOf('-');
    if (lastIndex == -1) {
        return null;
    }
    return zone.substring(0, lastIndex);
} // zoneToRegion


/**
 * Get the region from the GCE metadata.
 * @returns The region of the CE.
 */
async function getRegion() {
    // The region isn't in the metadata but the zone is.  We ask for the zone
    // and then strip of the trailing part in the expectation that the result
    // will now be the region.
    let zone = await getZone();
    if (zone == null) {
        return null;
    }
    return zoneToRegion(zone);
} // getRegion


/*
getProjectId().then(result => {
    console.log(`ProjectID: ${result}`);
});

getZone().then(result => {
    if (result == null) {
        return null;
    }
    console.log(`Zone: ${result}`);
});

getRegion().then(result => {
    console.log(`Region: ${result}`);
});
*/


module.exports = {
    getProjectId: getProjectId,
    getZone: getZone,
    getRegion: getRegion,
    getMetadata: getMetadata
};
