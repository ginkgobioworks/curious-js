/* global describe it beforeEach */

// mocha.js tests for functions dealing with Curious objects
(function () {
  'use strict';

  var expect = require('chai').expect;
  var curious = require('../curious.js');
  var examples = require('./examples.js');

  // TESTS

  describe('CuriousObjects', function () {
    describe('#values', function () {
      var obj;

      beforeEach(function () {
        obj = {
          a: 1,
          b: 'two',
          c: ['3'],
          d: {'4': true},
          e: function () { return 5; },
        };
      });

      it('should return all of the values of an object', function () {
        expect(curious.CuriousObjects.values(obj)).to.have.deep.members(
          [obj.a, obj.b, obj.c, obj.d, obj.e]
        );
      });

      it('should return values in the same order as "for-in"', function () {
        var key;
        var valuesInOrder = [];

        for (key in obj) {
          if (obj.hasOwnProperty(key)) {
            valuesInOrder.push(obj[key]);
          }
        }
        expect(curious.CuriousObjects.values(obj)).to.deep.equal(valuesInOrder);
      });

      it('should maintain only complex references', function () {
        var vals = curious.CuriousObjects.values(obj);

        vals.forEach(function (value, ix) {
          // Simple reference
          if (value === 1) {
            // Use vals[ix] instead of value here to make sure we mutate vals
            // and not a shallow copy
            vals[ix] = 'moop';
          }

          // Complex reference
          if (JSON.stringify(value) === JSON.stringify({'4': true})) {
            vals[ix][4] = 'something';
          }
        });

        // Simple references do not change
        expect(obj.a).to.equal(1);
        // Complex references do change
        expect(obj.d['4']).to.equal('something');
      });
    });

    describe('#groupObjectsByID', function () {
      var objs;

      beforeEach(function () {
        objs = [
          {name: 'a', id: 1},
          {name: 'b', id: 2},
          {name: 'c', id: 3},
        ];
      });

      it('should return an object', function () {
        expect(curious.CuriousObjects.groupObjectsByID(objs)).to.be.an('object');
      });

      it('should contain all of the IDs', function () {
        expect(curious.CuriousObjects.groupObjectsByID(objs)).to.have.all.keys(
          {'1': objs[0], '2': objs[1], '3': objs[2]}
        );
      });

      it('should maintain only complex references', function () {
        var objsByID = curious.CuriousObjects.groupObjectsByID(objs);

        // Simple reference
        objsByID[1] = 'moop'; // objs[0]
        // Complex reference
        objsByID[2].name = 'broop'; // objs[1]

        // Simple references do not change
        expect(objs[0]).to.have.all.keys({name: 'a', id: 1});
        // Complex references do change
        expect(objs[1]).to.have.all.keys({name: 'broop', id: 2});
      });

      it('should take the last object in the arary in case of duplicate IDs', function () {
        var objsByID;

        objs.push({name: 'b2', id: 2});
        objsByID = curious.CuriousObjects.groupObjectsByID(objs);

        expect(objsByID[2]).to.have.property('name', 'b2');
      });

      it('should ignore objects without IDs', function () {
        var objsByID;
        var objsByIDWithNoID;

        objsByID = curious.CuriousObjects.groupObjectsByID(objs);

        objs.push({name: 'noID'});

        objsByIDWithNoID = curious.CuriousObjects.groupObjectsByID(objs);

        expect(objsByID).to.deep.equal(objsByIDWithNoID);
      });
    });

    describe('#idList', function () {
      var objs;

      beforeEach(function () {
        objs = [
          {name: 'a', id: 1},
          {name: 'b', id: 2},
          {name: 'c', id: 3},
        ];
      });

      it('should contain all of the IDs', function () {
        expect(curious.CuriousObjects.idList(objs)).to.have.members([1, 2, 3]);
      });

      it('should not contain duplicates', function () {
        objs.push({name: 'b2', id: 2});

        expect(curious.CuriousObjects.idList(objs)).to.have.members([1, 2, 3]);
      });

      it('should maintain the order of IDs and keep the first unique one', function () {
        // This object with id = 2 will be ignored, but the first one will be kept.
        objs.push({name: 'b2', id: 2});
        objs.push({name: 'd', id: 4});
        objs.push({name: 'e', id: 0});
        // This object with id = 2 will also be ignored
        objs.push({name: 'b3', id: 2});
        objs.push({name: 'f', id: 23});

        expect(curious.CuriousObjects.idList(objs)).to.deep.equal([1, 2, 3, 4, 0, 23]);
      });
    });

    describe('#idString', function () {
      var objs;

      function _parseToNumbers(idString) {
        return idString.split(',').map(function (id) {return Number(id);});
      }

      beforeEach(function () {
        objs = [
          {name: 'a', id: 1},
          {name: 'b', id: 2},
          {name: 'c', id: 3},
        ];
      });

      it('should be equivalent to idList', function () {
        expect(_parseToNumbers(curious.CuriousObjects.idString(objs))).to.deep.equal(
          curious.CuriousObjects.idList(objs)
        );

        // This object with id = 2 will be ignored, but the first one will be kept.
        objs.push({name: 'b2', id: 2});
        objs.push({name: 'd', id: 4});
        objs.push({name: 'e', id: 0});
        // This object with id = 2 will also be ignored
        objs.push({name: 'b3', id: 2});
        objs.push({name: 'f', id: 23});

        expect(_parseToNumbers(curious.CuriousObjects.idString(objs))).to.deep.equal(
          curious.CuriousObjects.idList(objs)
        );
      });

      it('should not escape commas', function () {
        objs.push({name: 'commas', id: '4,5,6'});

        expect(
          // 1, 2, 3, 4, 5, 6, converted to numbers
          _parseToNumbers(curious.CuriousObjects.idString(objs))
        ).to.deep.equal(
          // Remove the element we added ('4,5,6') and add 4, 5, 6 to the end
          curious.CuriousObjects.idList(objs).slice(0, -1).concat([4, 5, 6])
        );
      });
    });

    describe('#camelCase', function () {
      var camelCase = curious.CuriousObjects.makeCamelCase;

      it('should replace all _ with a camel-casing', function () {
        expect(camelCase('a_single')).to.equal('aSingle');
        expect(camelCase('a_double_one')).to.equal('aDoubleOne');
        expect(camelCase('a_triple_one_even')).to.equal('aTripleOneEven');
        expect(camelCase('something_else_entirely')).to.equal('somethingElseEntirely');
      });

      it('should replace all - with a camel-casing', function () {
        expect(camelCase('a-single')).to.equal('aSingle');
        expect(camelCase('a-double-one')).to.equal('aDoubleOne');
        expect(camelCase('a-triple-one-even')).to.equal('aTripleOneEven');
      });

      it('should correctly handle mixed - and _', function () {
        expect(camelCase('a-first-mix')).to.equal('aFirstMix');
        expect(camelCase('a_second-one')).to.equal('aSecondOne');
        expect(camelCase('a-triple_one-even')).to.equal('aTripleOneEven');
      });

      it('should correctly handle multiple separators', function () {
        expect(camelCase('a--single')).to.equal('aSingle');
        expect(camelCase('a__single')).to.equal('aSingle');
        expect(camelCase('a__double--one')).to.equal('aDoubleOne');
        expect(camelCase('a_______many')).to.equal('aMany');
        expect(camelCase('a__-_-__many')).to.equal('aMany');
      });

      it('should leave leading underscores or dashes', function () {
        expect(camelCase('_a_single')).to.equal('_aSingle');
        expect(camelCase('-a_single')).to.equal('-aSingle');
        expect(camelCase('__a_single')).to.equal('__aSingle');
        expect(camelCase('__a-single')).to.equal('__aSingle');
        expect(camelCase('_-_a_single')).to.equal('_-_aSingle');
      });

      it('should leave trailing underscores or dashes', function () {
        expect(camelCase('a_single_')).to.equal('aSingle_');
        expect(camelCase('a_single-')).to.equal('aSingle-');
        expect(camelCase('a_single__')).to.equal('aSingle__');
        expect(camelCase('a-single__')).to.equal('aSingle__');
        expect(camelCase('__a-single__')).to.equal('__aSingle__');
        expect(camelCase('_-_a_single-_-')).to.equal('_-_aSingle-_-');
      });

      it('should leave periods alone', function () {
        expect(camelCase('some_thing.prop')).to.equal('someThing.prop');
      });

      it('should overwrite existing casing', function () {
        expect(camelCase('some_HTML_thing')).to.equal('someHtmlThing');
        expect(camelCase('soMany_WORDS_might_Be_capitalized'))
          .to.equal('somanyWordsMightBeCapitalized');
      });

      it('should correctly handle special-character variables like $, $$, _, __, etc.', function () {
        expect(camelCase('_')).to.equal('_');
        expect(camelCase('__')).to.equal('__');
        expect(camelCase('$')).to.equal('$');
        expect(camelCase('$$')).to.equal('$$');
      });

      it('should leave valid expressions alone', function () {
        expect(camelCase('word')).to.equal('word');
        expect(camelCase('aCamelCasedExpression')).to.equal('aCamelCasedExpression');
        expect(camelCase('_aPrefixedExpression')).to.equal('_aPrefixedExpression');
      });

      it('should leave null and undefined values unchanged', function () {
        expect(camelCase(null)).to.equal(null);
        expect(camelCase()).to.be.an('undefined');
      });
    });

    describe('#parse', function () {
      var queryJSONResponse;

      beforeEach(function () {
        queryJSONResponse = examples.response().result;
      });

      it('should correctly parse the output', function () {
        var expectedObjects = examples.expectedObjects();

        expect(curious.CuriousObjects.parse(
          ['experiments', 'reactions'],
          null,
          queryJSONResponse
        )).to.deep.equal(
          {
            objects: [
              expectedObjects.experiments,
              expectedObjects.reactions,
            ],
            trees: [null, null],
          }
        );
      });

      it('should correctly camel-case the output', function () {
        var expectedObjects = examples.expectedObjects(true);

        expect(curious.CuriousObjects.parse(
          ['experiments', 'reactions'],
          null,
          queryJSONResponse,
          null,
          true
        )).to.deep.equal(
          {
            objects: [
              expectedObjects.experiments,
              expectedObjects.reactions,
            ],
            trees: [null, null],
          }
        );
      });

      it('should construct objects correctly with custom constructors', function () {
        var constructors;
        var parsedData;

        // Fake constructors
        function Experiment() {
          // Do nothing
        }

        function Reaction() {
          // Do nothing
        }

        constructors = [Experiment, Reaction];

        parsedData = curious.CuriousObjects.parse(
          ['experiments', 'reactions'],
          constructors,
          queryJSONResponse
        );

        parsedData.objects.forEach(function (objectsByID, ix) {
          var objects = curious.CuriousObjects.values(objectsByID);

          objects.forEach(function (object) {
            expect(object).to.be.an.instanceof(constructors[ix]);
          });
        });
      });

      it('should combine new objects with existing ones', function () {
        var parsedData;
        // jscs:disable requireCamelCaseOrUpperCaseIdentifiers
        var existingObjects = [
          null,
          {
            23063: {
              id: 23063,
              created_by_id: 12345,
              created_on: 'another date',
              updated_by_id: 67890,
              updated_on: 'another time',
              experiment_id: 403,
              is_blank: false,
              is_control: false,
              notes: '',
              sample_id: 124816,
              __url: 'http://example.com/experiment/403/',
              __model: 'Reaction',
            },
          },
        ];
        // jscs:enable

        parsedData = curious.CuriousObjects.parse(
          ['experiments', 'reactions'],
          null,
          queryJSONResponse,
          existingObjects
        );

        expect(parsedData.objects[1][23063]).to.contain.keys(existingObjects[1][23063]);
      });
    });

    describe('#defaultType', function () {
      var CuriousObject = curious.CuriousObjects.defaultType;

      describe('#toJSON', function () {
        var exampleObjectsWithoutKeys;
        var exampleObjectsWithKeys;

        beforeEach(function () {
          exampleObjectsWithoutKeys = [
            true,
            false,
            3,
            0,
            'something',
            '',
            null,
            {},
            [],
            [1],
            [1, 2, {3: 'q'}],
          ];

          exampleObjectsWithKeys = [
            { a: 1 },
            { a: 1, b: 2, 34: 'sam', d: { n: 'nested' }, e: [5, 6]},
          ];
        });

        it("should be equivalent to serializing the object's internal data keys", function () {
          exampleObjectsWithKeys.forEach(function (obj) {
            var curiousObj = new CuriousObject(obj);
            var internalObj = obj;

            ['__model', '__url'].forEach(function (field) {
              internalObj[field] = curiousObj[field];
            });

            // Use JSON.parse and .to.deep.equal to allow for varying order of serialization
            expect(curiousObj.toJSON()).to.deep.equal(obj);
          });
        });

        it('should create empty objects for serializing objects with no internal data', function () {
          exampleObjectsWithoutKeys.forEach(function (obj) {
            var curiousObj = new CuriousObject(obj);
            var internalObj = {
              __model: null,
              __url: null,
            };

            // Use JSON.parse and .to.deep.equal to allow for varying order of serialization
            expect(JSON.parse(JSON.stringify(curiousObj.toJSON())))
              .to.deep.equal(internalObj);
          });
        });

        it('should register the class with JSON.stringify', function () {
          exampleObjectsWithKeys.forEach(function (obj) {
            var curiousObj = new CuriousObject(obj);
            var internalObj = obj;

            ['__model', '__url'].forEach(function (field) {
              internalObj[field] = curiousObj[field];
            });

            // Use JSON.parse and .to.deep.equal to allow for varying order of serialization
            expect(JSON.parse(JSON.stringify(curiousObj)))
              .to.deep.equal(internalObj);
          });
        });
      });

      describe('#fromJSON', function () {
        it('should create CuriousObject instances when required', function () {
          expect(CuriousObject.fromJSON(JSON.stringify({
            a: 1,
            __model: null,
            __url: null,
          }))).to.deep.equal(new CuriousObject({ a: 1 }));
        });

        it('should not create CuriousObject instances unnecessarily', function () {
          expect(CuriousObject.fromJSON(JSON.stringify({
            a: 1,
          }))).to.deep.equal({ a: 1 });
        });

        it('should be idempotent with JSON.stringify', function () {
          var exampleObject = examples.expectedObjects().experiments[403];

          exampleObject.reactions = []; // Prevent it from being circular to allow serialization
          expect(CuriousObject.fromJSON(JSON.stringify(exampleObject))).to.deep.equal(exampleObject);
        });
      });
    });
  });
}());
