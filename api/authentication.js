const request = require('request');

module.exports = {
  auth : (token, cb) => {
    return request('http://authentication-service/auth?token=' + token, (error, response) => {
      cb(error, response);
    });
  },
};