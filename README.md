# PromiseStore

PromiseStore allows you to quickly request resources. Whether that resource needs to be fetched (from an API or elsewhere) or it is cached, is abstracted for the user.

The PromiseStore is initialized with a resolver function that handles resource requests and stores the responses in caches. Each ‘resource’ has a cache, which can optionally be set to expire.

This allows you to do something like request the same data in two places, and only make 1 API call, and then continue to request it until the cached value expires.

## Example Usage

```javascript
var resolver = require('./some_resolver_module_you_wrote'); //See /examples folder
var store = new PromiseStore({resolver});

store.request('some_resource', {params: {p1: 0, p2: 1}}); //Will fetch fresh resource from api
store.request('some_resource', {params: {p1: 0, p2: 1}}); //Will use cached response
store.request('some_resource', {params: {p1: 1, p2: 1}}); //Will  fetch fresh resource from api because the parameter is different

store.requestMany({
  some_resource:   {params: {p1: 0}},
  some_resource_2: {params: {p1: 1}}
}); //Will fetch two resources at once
store.requestMany({
  some_resource_2: {params: {p1: 1}}
}); //Will use cached api response for some_resource_2
store.requestMany({
  some_resource_2: {params: {p1: 1}}
}); //Will fetch new resource
```

## Writing a Resolver

The requirements of the resolver are very minimal so that it can be used for a number of different cases.

You can technically get away with something that looks like this:

```javascript
var resolver = {
  schema: {
    resource1: {}
  },
  resolve: (resourceRequests) => {
    //resourceRequests looks like:
    //  {<resourceKey>: {params: <params object>, cache: <ResourceCache>}}
    //In this case:
    //  {resource1:     {params: {},              cache: <ResourceCache>}}

    //It expects a response in a similar format: {<resourceKey>: <resourceValue>}
    return Promise.resolve({resource1: 'some resource value'});
  }
};
```

But typical resolvers look more like this:

```javascript
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
    var paramsToCacheKey = $.param(request.params);

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
```

You need:

 - To provide a `schema` which much be an object whose keys are resource keys
 - To provide a `resolve` method which:
  - Must accept an argument that is an object whose keys are resource keys and whose values are parameter objects (think POST request bodies or similar)
  - Must respond with a `Promise` whose keys are resource keys and whose values are the values you want the user to be able to use.

## Important exposed methods

#### .request()

```javascript
PromiseStore.request(resourceKey<string>, config<object>) -> Promise
```

Validates `resourceKey` and `config.params` against your `schema`, and then calls your resolver, passing it `[{<resourceKey>: <config>}]` as its parameter. It extends config by including `cache: <ResourceCache>`, (either a new or existing one depending on if the resource has been requested before or not);

Responds with a `Promise` which resolves to the resource value **NOT** an object of the format `{<resourceKey>: <resourceValue>}`.

#### .requestMany()

```javascript
PromiseStore.requestMany([{resourceKey<string>: config<object>}, ...]) -> Promise
```

Validates each request in the array just like request, and then passes the object to your resolver.

Response with `Promise` which resolves to an object of the format `{<resourceKey>: <resourceValue>}`.

## Caching resources

This is an important, but technically not necessary part of using the `PromiseStore`. You should get your `schema` and `resolve` method working without them first.

Both request and requestMany include a ResourceCache that is passed along with the config object for each resource request (`cache: <ResourceCache>`) to your resolve method.

Technically you can ignore the cache, and even write your own caching class if you like.

## ResourceCache

A class including:

Data methods for caching data when it comes back from a request:

- `.getData(key)` - get the data stored for a key
- `.setData(key)` - set data for a key
- `.hasData(key) -> Boolean` - check if there is any data for a key

`Promise` methods to minimize duplicate API calls before either is complete (basically caching requests here, not response data)

- `.getPromise(key)` - get the `Promise` stored for a key
- `.setPromise(key)` - set a `Promise` for a key
- `.hasPromise(key) -> Boolean` - check if there is a `Promise` open for a key

An expire method to destroy data and promises associated with a key

`.expireKey(key)` - manually trigger the expiration of cached resource

The `key` argument passed to each of these methods can be any hashable value you like, but we suggest something like: JSON.stringify(resourceRequest.params) so that you cache resources by parameters.

## License

(The MIT License)

Copyright (c) 2017 Henrybuilt.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
