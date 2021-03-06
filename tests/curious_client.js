/* global describe it before after */

// mocha.js tests for functions dealing with Curious objects
(function () {
  'use strict';

  var axios = require('axios');
  var expect = require('chai').expect;
  var curious = require('../curious.js');
  var examples = require('./examples.js');
  var server = require('./server.js');
  var Promise = require('es6-promise');

  // TESTS

  describe('CuriousClient', function () {
    var srv;

    before(function (done) {
      srv = server.start(done);
    });

    after(function (done) {
      srv.close(done);
    });

    describe('#queryUrl', function () {
      function _queryUrl(baseUrl) { return new curious.CuriousClient(baseUrl).queryUrl; }

      it('should add "/q/" to url paths', function () {
        expect(_queryUrl('foobar.com/curious')).to.equal('foobar.com/curious/q/');
        expect(_queryUrl('foobar.com/curious/')).to.equal('foobar.com/curious/q/');
      });

      it('should add "/q/" to server urls', function () {
        expect(_queryUrl('curious.foobar.com')).to.equal('curious.foobar.com/q/');
        expect(_queryUrl('curious.foobar.com/')).to.equal('curious.foobar.com/q/');
      });

      it('should add "/q/" to local urls', function () {
        expect(_queryUrl('curious/')).to.equal('curious/q/');
        expect(_queryUrl('curious')).to.equal('curious/q/');
        expect(_queryUrl('/curious/')).to.equal('/curious/q/');
        expect(_queryUrl('/curious')).to.equal('/curious/q/');
      });

      it('should add "/q/" to empty urls', function () {
        expect(_queryUrl('')).to.equal('/q/');
        expect(_queryUrl('/')).to.equal('/q/');
        expect(_queryUrl('//')).to.equal('//q/');
      });

      it('should not add extra "/q/"s to url paths', function () {
        expect(_queryUrl('foobar.com/curious/q')).to.equal('foobar.com/curious/q/');
        expect(_queryUrl('foobar.com/curious/q/')).to.equal('foobar.com/curious/q/');
      });

      it('should not add extra "/q/"s to server urls', function () {
        expect(_queryUrl('curious.foobar.com/q')).to.equal('curious.foobar.com/q/');
        expect(_queryUrl('curious.foobar.com/q/')).to.equal('curious.foobar.com/q/');
      });

      it('should not add extra "/q/"s to local urls', function () {
        expect(_queryUrl('curious/')).to.equal('curious/q/');
        expect(_queryUrl('curious')).to.equal('curious/q/');
        expect(_queryUrl('/curious/')).to.equal('/curious/q/');
        expect(_queryUrl('/curious')).to.equal('/curious/q/');
      });

      it('should not add extra "/q/" to "q" urls', function () {
        expect(_queryUrl('/q')).to.equal('/q/');
        expect(_queryUrl('/q/')).to.equal('/q/');
        expect(_queryUrl('//q')).to.equal('//q/');
        expect(_queryUrl('//q/')).to.equal('//q/');
      });
    });

    describe('#performQuery', function () {
      it('should remove all line breaks and extra whitespace', function () {
        // Encapsulate logic for testing query processing
        function testQueryString(original, expected) {
          // Fake request function that tests whether or not the arguments are what we expect
          function fakeRequest(url, args) {
            expect(args.q).to.equal(expected);

            // Must resolve to an object with a 'result' property to prevent errors in parsing
            return Promise.resolve({ result: args });
          }

          return new curious.CuriousClient(server.url, fakeRequest, null, true).performQuery(original);
        }

        return Promise.all([
          testQueryString('no breaks', 'no breaks'),
          testQueryString(
            'break\nin the middle',
            'break in the middle'
          ),
          testQueryString(
            'multiple\nbreaks\nin the middle',
            'multiple breaks in the middle'
          ),
          testQueryString(
            '\nmultiple\nbreaks\nin the middle and edges\n',
            'multiple breaks in the middle and edges'
          ),
          testQueryString(
            'multiple\nbreaks\n\nin a row',
            'multiple breaks in a row'
          ),
          testQueryString(
            '   extra space at the start',
            'extra space at the start'
          ),
          testQueryString(
            'extra space at the end    ',
            'extra space at the end'
          ),
          testQueryString(
            '   extra space at the start and end   ',
            'extra space at the start and end'
          ),
        ]);
      });

      it('should work with axios', function (done) {
        var requestFunctions;
        // Set the global axios variable to test axios wrapper defaults
        if (typeof global !== 'undefined' && !global.axios) {
          global.axios = axios;
        }

        requestFunctions = [
          curious.CuriousClient.wrappers.axios(axios),
          curious.CuriousClient.wrappers.axios(axios.post),
          curious.CuriousClient.wrappers.axios(),
        ];

        try {
          // Try with and without camelCase
          [true, false].forEach(function (camelCase) {
            requestFunctions.forEach(function (requestFunction) {
              var client = new curious.CuriousClient(
                server.url,
                requestFunction,
                null,
                true,
                camelCase
              );

              client.performQuery(
                'query does not matter',
                ['experiments', 'reactions']
              )
              .then(function (response) {
                var expectedObjects = examples.expectedObjects(camelCase);
                expect(response).to.deep.equal({
                  trees: [null, null],
                  objects: {
                    experiments: curious.CuriousObjects.values(expectedObjects.experiments),
                    reactions: curious.CuriousObjects.values(expectedObjects.reactions),
                  },
                });
              }, function (error) {
                throw error;
              });
            });
          });

          // Clean up the global axios variable
          if (typeof global !== 'undefined' && global.axios) {
            delete global.axios;
          }

          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });
}());
