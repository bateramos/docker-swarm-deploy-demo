const authentication = require('./authentication');
const services = {
  'authentication' : createProxy(authentication),
};

function createProxy(original) {
  const copy = Object.assign(original, {});
  Object.keys(copy).forEach(key => {
    const property = copy[key];
    if (typeof property === 'function') {
      copy[key] = proxyFunction(property);
    }
  });

  return copy;
}

function proxyFunction(func) {
  const proxy = new Proxy(func, {
    apply : function(target, thisArg, argumentsList) {
      const promise = new Promise((resolve, reject) => {
        const returnValue = target(argumentsList, (error, result) => {
          return error ? reject(error) : resolve(result);
        });
      });
      const returnValue = target(argumentsList, () => {
        return promise.resolve ? promise.resolve(returnValue) : promise;
      });

      if ('then' in returnValue) {
        return returnValue;
      }

      return promise;
    }
  });

  return proxy;
}

function service(name) {
  return services[name];
}

module.exports = service;