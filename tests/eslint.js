/* global describe it before beforeEach after */

// mocha.js tests for the functions dealing with Curious queries
(function () {
  'use strict';
  var lint = require('mocha-eslint');

  lint([
    'curious.js',
    'tests',
  ]);
}());
