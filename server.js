const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');

const service = require('./api/services');
const InternalError = require('./error/InternalError');

const app = express();
app.use(bodyParser.json());

function fibonacci(n) {
 return n < 1 ? 0
      : n <= 2 ? 1
      : fibonacci(n - 1) + fibonacci(n - 2);
}

app.get('/fibonacci', (req, res) => {
  service('authentication')
    .auth(req.query.token)
    .then((response) => {
      if (response.statusCode !== 200) {
        throw new InternalError('', response.statusCode);
      }
    })
    .then(() => {
      const result = fibonacci(40);
      res.status(200).send({ result }).end();
    })
    .catch(error => {
      res.status(error.statusCode || 400).send(error.message || 'Unable to complete request');
    });
});

app.get('/auth', (req, res) => {
  if (req.query.token && req.query.token !== 'undefined') {
    res.status(200).end();
  } else if (req.body.user && req.body.password) {
    res.status(200).end();
  } else {
    res.status(401).end(); 
  }
});

app.listen(80, function () {
  console.log('Example app listening on port 80!');
});