/**
 * A trivial curious server
 * @module examples
 */
(function () {
  'use strict';

  var http = require('http');
  var examples = require('./examples.js');

  var PORT = 8080;
  var URL = 'http://localhost:' + PORT;

  function start(cb) {
    var server;

    server = http.createServer(function (request, response) {
      response.writeHead(200, {
        'Content-Type': 'application/json',
      });
      response.end(JSON.stringify(examples.response()));
    });

    server.listen(PORT, function () { return cb(); });
    server.on('error', cb);

    return server;
  }

  module.exports = {
    url: URL,
    start: start,
  };

  return module.exports;
}());
