## PromiseStore

PromiseStore allows you to request resources. Whether that resource needs to be fetched (from an API or elsewhere) or it is cached, is abstracted for the user. The Store is initialized with a resolver function that handles resource requests and stores the responses in caches. Each ‘resource’ has a cache, which can optionally be set to expire. This allows you to do something like request the same data in two places, and only make 1 API call, and then continue to request it until the cached value expires
