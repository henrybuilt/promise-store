const lib = require('../lib');

var resolver = {};

resolver.schema = {
  sections: {
    expiresIn: 60 * 60,
    query: () => `sections { id, title }`
  },
  fields: {
    expiresIn: 60 * 60,
    params: ['sectionId'],
    query: params => `fields(sectionId: ${params.sectionId}) { id, title, type, valueMap, defaultValue }`
  },
  entries: {
    expiresIn: 5 * 60,
    params: ['sectionId'],
    query: params => `entries(sectionId: ${params.sectionId}) { id, data }`
  }
};

resolver.resolve = (requests) => {
  var resourcePromises = [];
  var apiResourceRequests = [];

  //Map requests to data from cache or promises
  requests.forEach((request) => {
    //All requests will be handled the same way
    var requestSchema = resolver.schema[request.key];
    var query = requestSchema.query(request.params);
    var paramsToCacheKey = $.param(request.params);

    if (request.cache.hasData(paramsToCacheKey)) { //We've got a response for that already!
      console.log(request.key, paramsToCacheKey, 'grabbed from data cache');

      resourcePromises.push(Promise.resolve([{key: request.key, value: request.cache.getData(paramsToCacheKey)}]));
    }
    else if (request.cache.hasPromise(paramsToCacheKey)) { //We've already got an API request out for that
      console.log(request.key, paramsToCacheKey, 'grabbed from promise cache');

      resourcePromises.push(request.cache.getPromise(paramsToCacheKey));
    }
    else { //We need to make a request
      console.log('requested new resource from api')
      apiResourceRequests.push({key: request.key, paramsToCacheKey, query, cache: request.cache});
    }
  });

  //Only make an API call if there are API Resource Requests
  if (apiResourceRequests.length) {
    var apiPromise = lib.api.query(apiResourceRequests.map(ar => ar.query)).then((response) => {
      var resourceArray = [];

      apiResourceRequests.forEach(apiResourceRequest => {
        var key = apiResourceRequest.key;

        if (response.data[key]) {
          apiResourceRequest.cache.setData(apiResourceRequest.paramsToCacheKey, response.data[key]);

          resourceArray.push({key, value: response.data[key]});
        }
      });

      return resourceArray;
    });

    apiResourceRequests.forEach(apiResourceRequest => {
      apiResourceRequest.cache.setPromise(apiResourceRequest.paramsToCacheKey, apiPromise);
    });

    //Push 1 API request for the unresolved requests
    resourcePromises.push(apiPromise);
  }

  return Promise.all(resourcePromises).then((resourceArrays) => {
    var resources = {};
    
    resourceArrays.forEach(resourceArray => {
      resourceArray.forEach(resource => resources[resource.key] = resource.value);
    });

    return resources;
  });
};

module.exports = resolver;
