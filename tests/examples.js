/**
 * Functions for returning shared example Curious objects and responses.
 * @module examples
 */
(function () {
  'use strict';
  var curious = require('../curious.js');

  /**
   * Generate sample data as would be returned by a Curious server in JSON.
   *
   * @return {Object} The response data
   */
  exports.response = function () {
    return {
      result: {
        computed_on: '2015-05-21 14:36:07.478769',
        last_model: 'Reaction',
        results: [
          {
            model: 'Experiment',
            join_index: -1,
            tree: null,
            objects: [
              [403, null],
            ],
          }, {
            model: 'Reaction',
            join_index: 0,
            tree: null,
            objects: [
              [23063, 403],
              [23064, 403],
              [23057, 403],
            ],
          },
        ],
        data: [
          { // Experiments
            fields: [
              'id',
              'created_by_id',
              'created_on',
              'updated_by_id',
              'updated_on',
              'assay_id',
              'name',
              'description',
              'completed',
              'ignore',
              'temperature',
            ],
            objects: [
              [
                403,
                22,
                '2015-01-16 14:54:13+00:00',
                22,
                '2015-05-14 16:03:13+00:00',
                1,
                'MS2 for x401 and x402',
                '',
                true,
                false,
                null,
              ],
            ],
            urls: [
              'http://example.com/experiment/403/',
            ],
          }, {
            fields: [
              'id',
              'created_by_id',
              'created_on',
              'updated_by_id',
              'updated_on',
              'experiment_id',
              'is_blank',
              'is_control',
              'notes',
              'sample_id',
            ],
            objects: [
              [
                23057,
                null,
                '2015-01-16 14:54:27+00:00',
                null,
                '2015-01-16 14:54:27+00:00',
                403,
                false,
                false,
                '',
                454565,
              ], [
                23063,
                null,
                '2015-01-16 14:54:27+00:00',
                null,
                '2015-01-16 14:54:27+00:00',
                403,
                true,
                false,
                '',
                null,
              ], [
                23064,
                null,
                '2015-01-16 14:54:27+00:00',
                null,
                '2015-01-16 14:54:27+00:00',
                403,
                true,
                false,
                '',
                null,
              ],
            ],
            urls: [
              'http://example.com/experiment/403/',
              'http://example.com/experiment/403/',
              'http://example.com/experiment/403/',
            ],
          },
        ],
      },
    };
  };

  /**
   * Generate sample data as would be returned by a Curious server in JSON.
   *
   * @param {boolean?} camelCase
   *   If true, construct camel-cased versions of the objects.
   *
   * @return {{experiments: Object<number, Object>, reactions: Object<number, Object>}}
   *   The objects expected to be constructed from @{link examples.response|the response}
   */
  exports.expectedObjects = function (camelCase) {
    var exp;
    var rxns;
    var CuriousObject = curious.CuriousObjects.defaultType;

    // jscs:disable requireCamelCaseOrUpperCaseIdentifiers
    exp = new CuriousObject({
      id: 403,
      created_by_id: 22,
      created_on: '2015-01-16 14:54:13+00:00',
      updated_by_id: 22,
      updated_on: '2015-05-14 16:03:13+00:00',
      assay_id: 1,
      name: 'MS2 for x401 and x402',
      description: '',
      completed: true,
      ignore: false,
      temperature: null,
      __url: 'http://example.com/experiment/403/',
      __model: 'Experiment',
    }, camelCase);

    rxns = [
      {
        id: 23063,
        created_by_id: null,
        created_on: '2015-01-16 14:54:27+00:00',
        updated_by_id: null,
        updated_on: '2015-01-16 14:54:27+00:00',
        experiment_id: 403,
        is_blank: true,
        is_control: false,
        notes: '',
        sample_id: null,
        __url: 'http://example.com/experiment/403/',
        __model: 'Reaction',
      }, {
        id: 23064,
        created_by_id: null,
        created_on: '2015-01-16 14:54:27+00:00',
        updated_by_id: null,
        updated_on: '2015-01-16 14:54:27+00:00',
        experiment_id: 403,
        is_blank: true,
        is_control: false,
        notes: '',
        sample_id: null,
        __url: 'http://example.com/experiment/403/',
        __model: 'Reaction',
      }, {
        id: 23057,
        created_by_id: null,
        created_on: '2015-01-16 14:54:27+00:00',
        updated_by_id: null,
        updated_on: '2015-01-16 14:54:27+00:00',
        experiment_id: 403,
        is_blank: false,
        is_control: false,
        notes: '',
        sample_id: 454565,
        __url: 'http://example.com/experiment/403/',
        __model: 'Reaction',
      },
    ].map(function (objectData) { return new CuriousObject(objectData, camelCase); });

    // Link foregin keys
    exp.reactions = rxns;
    rxns.forEach(function (rxn) { rxn.experiments = [exp]; });

    return {
      experiments: {
        403: exp,
      },
      reactions: {
        23063: rxns[0],
        23064: rxns[1],
        23057: rxns[2],
      },
    };
  };
}());
