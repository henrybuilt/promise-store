var resolver = {};

resolver.schema = {
  some_api_resource: {
    expiresIn: 5 * 60, //seconds
    params: ['someId'],
    url: (params) => `some_api_resource/${params.someId}`
  },
};

resolver.resolve = (requests) => {
  var resourcePromises = [];
  var apiResourceRequests = [];

  //Map requests to data from cache or promises
  requests.forEach((request) => {
    //All requests will be handled the same way
    var requestSchema = resolver.schema[request.key];
    var url = requestSchema.url(request.params);
    var paramsToCacheKey = JSON.stringify(request.params);

    if (request.cache.hasData(paramsToCacheKey)) { //We've got a response for that already!
      resourcePromises.push(Promise.resolve({key: request.key, value: request.cache.getData(paramsToCacheKey)}));
    }
    else if (request.cache.hasPromise(paramsToCacheKey)) { //We've already got an API request out for that
      resourcePromises.push(request.cache.getPromise(paramsToCacheKey));
    }
    else { //We need to make a request
      resourcePromises.push(api.request(url).then((response) => {
        return {key: request.key, value: response.body};
      }));
    }
  });

  return Promise.all(resourcePromises).then((resourceArray) => {
    var resources = {};

    resourceArray.forEach(resource => resources[resource.key] = resource.value);

    return resources;
  });
};

module.exports = resolver;
