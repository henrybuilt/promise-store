const ResourceCache = require('./resource_cache');

/*
Maybe I can explain it better:
 */

/**
 * === Promise Store ===
 * Allow caching of expensive resources, like API call responses.
 */
class PromiseStore {
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
}

module.exports = Store;
