const test = require('../../test');
const Store = require('./');

describe('Store', () => {
  var apiRequests = 0;

  var resolver = {
    schema: {res1: {}, res2: {}},
    resolve: (requests) => {
      var resourcePromises = [];

      var res1 = (params, cache) => {
        var response;

        if (cache.hasData(params.param)) {
          response = Promise.resolve({key: 'res1', resource: `retrieved res1 and cached value for param: ${params.param}`});
        }
        else if (cache.hasPromise(params.param)) {
          response = cache.getPromise(params.param);
        }
        else {
          apiRequests++;

          response = new Promise((resolve, reject) => {
            setTimeout(() => {
              cache.setData(params.param, 1);

              resolve({key: 'res1', resource: `retrieved res1 and stored value for param: ${params.param}`});
            });
          });

          cache.setPromise(params.param, response);
        }

        return response;
      }

      var res2 = (params, cache) => {
        var response;

        if (cache.hasData(params.param)) {
          response = Promise.resolve({key: 'res2', resource: `retrieved res2 and cached value for param: ${params.param}`});
        }
        else {
          apiRequests++;

          response = new Promise((resolve, reject) => {
            setTimeout(() => {
              cache.setData(params.param, 1);

              resolve({key: 'res2', resource: `retrieved res2 and stored value for param: ${params.param}`});
            });
          });
        }

        return response;
      }

      requests.forEach((request) => {
        if (request.key === 'res1') {
          resourcePromises.push(res1(request.params, request.cache));
        }
        else if (request.key === 'res2') {
          resourcePromises.push(res2(request.params, request.cache));
        }
      });

      return Promise.all(resourcePromises).then((responses) => {
        var resources = {};

        responses.forEach(response => resources[response.key] = response.resource);

        return resources;
      });
    }
  };

  var store;

  beforeEach(() => {
    store = new Store({resolver});

    apiRequests = 0;
  });

  describe('3. Allow caching of expensive resources, like API call responses', () => {
    describe('request for an asynchronous resource', () => {
      it('should resolve the resource and store it for secondary access', (done) => {
        store.request('res1', {param: 0}).then(res1param0nocache => {
          store.request('res1', {param: 1}).then(res1param1nocache => {
            store.request('res1', {param: 0}).then(res1param0cache => {
              expect(res1param0nocache).to.equal('retrieved res1 and stored value for param: 0');
              expect(res1param1nocache).to.equal('retrieved res1 and stored value for param: 1');
              expect(res1param0cache).to.equal('retrieved res1 and cached value for param: 0');

              done();
            });
          });
        });
      });

      it('should resolve and cache multiple resources at once', (done) => {
        store.requestMany({res1: {param: 0}, res2: {param: 1}}).then(resources => {
          store.requestMany({res1: {param: 0}, res2: {param: 1}}).then(cachedResources => {
            expect(resources.res1).to.equal('retrieved res1 and stored value for param: 0');
            expect(resources.res2).to.equal('retrieved res2 and stored value for param: 1');
            expect(cachedResources.res1).to.equal('retrieved res1 and cached value for param: 0');
            expect(cachedResources.res2).to.equal('retrieved res2 and cached value for param: 1');

            done();
          });
        });
      });

      it('should re-use a cached promise if one is open in the cache', (done) => {
        Promise.all([
          store.request('res1', {param: 0}),
          store.request('res1', {param: 0}),
          store.request('res1', {param: 1})
        ]).then(responses => {
          expect(responses[0]).to.equal('retrieved res1 and stored value for param: 0');
          expect(responses[1]).to.equal('retrieved res1 and stored value for param: 0');
          expect(responses[2]).to.equal('retrieved res1 and stored value for param: 1');

          expect(apiRequests).to.equal(2);

          done();
        })
      });
    });
  });

  /*describe('request for a synchronous resource', () => {
    it('should', () => {
      var resource = store.request('');

      expect(resource).to.equal();
    });
  });*/

});
