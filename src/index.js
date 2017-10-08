const ResourceCache = require('./resource_cache');

/*
Maybe I can explain it better: the Store allows you to request resources. Whether that resource needs to be fetched (from an API or elsewhere) or it is cached, is abstracted for the user. The Store is initialized with a resolver function that handles resource requests and stores the responses in caches. Each ‘resource’ has a cache, which can optionally be set to expire. This allows you to do something like request the same data in two places, and only make 1 API call, and then continue to request it until the cached value expires
 */

/**
 * === Store ===
 * 1. Provide offline storage of data
 * 2. Allow sharing of data between pages
 * 3. Allow caching of expensive resources, like API call responses
 */
class Store {
  /**
   * [constructor description]
   * @param {array<string>} resourceKeys a list of unique keys
   * @param {array<string>} resourceResolver (array<>) {resourceKey1: value}
   */
  constructor(props) {
    props = props || {};
    //TODO nested resources?

    if (!props.resolver) {
      throw new Error('You need to provide a resolver to request resources');
    }

    this.resolver = props.resolver;
    this.resourceCaches = {};
  }

  /**
   * [exports description]
   * @param
   */
  share(resource) {
    resource.then();
  }

  resourceCacheForKey(key) {
    return this.resourceCaches[key] || (this.resourceCaches[key] = new ResourceCache());
  }

  /**
   * When resource is ready, let me know
   * @param  {string} resourceKey [description]
   * @return {Promise}
   */
  request(key, params) {
    params = params || {};

    if (!this.resolver.schema[key]) {
      throw new Error('Could not find resolver for resource');
    }

    //TODO expire caches
    var request = {key, params, cache: this.resourceCacheForKey(key)};

    return this.resolver.resolve([request]).then(resources => resources[key]);
  }

  requestMany(resourcesAndParams) {
    var requests = [];

    Object.entries(resourcesAndParams).forEach((entry) => {
      var key = entry[0];
      var params = entry[1];

      if (!this.resolver.schema[key]) {
        throw new Error('Could not find resolver for resource');
      }

      requests.push({key, params, cache: this.resourceCacheForKey(key)});
    });

    return this.resolver.resolve(requests);
  }

  //Stash values for later retrieval
  static save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  //Retreive stashed value
  static load(key) {
    return JSON.parse(localStorage.getItem(key));
  }
}

module.exports = Store;
