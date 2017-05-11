const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');

const app = express();
app.use(bodyParser.json());

function fibonacci(n) {
 return n < 1 ? 0
      : n <= 2 ? 1
      : fibonacci(n - 1) + fibonacci(n - 2);
}

app.get('/fibonacci', (req, res) => {
  request('http://authentication-service/auth?token=' + req.query.token, (error, response) => {
    const result = fibonacci(40);
    res.status(response.statusCode).send({ result }).end();
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