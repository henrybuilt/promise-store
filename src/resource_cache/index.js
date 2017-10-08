class ResourceCache {
  constructor() {
    this._data = {};
    this._promises = {};
  }

  //Data
  setData(key, data) {
    this._data[key] = data;
  }

  hasData(key) {
    return this._data[key] !== undefined;
  }

  getData(key) {
    return this._data[key];
  }

  expireData(key) {
    delete this._data[key];
  }

  //Promises
  setPromise(key, promise) {
    this._promises[key] = promise;
  }

  hasPromise(key) {
    return this._promises[key] !== undefined;
  }

  getPromise(key) {
    return this._promises[key];
  }
}

module.exports = ResourceCache;
