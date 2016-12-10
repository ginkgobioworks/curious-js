/* global describe it before beforeEach after */

// mocha.js tests for the functions dealing with Curious queries
(function () {
  'use strict';

  var expect = require('chai').expect;
  var curious = require('../curious.js');
  var axios = require('axios');
  var server = require('./server.js');

  describe('CuriousQuery', function () {
    describe('#query', function () {
      var expectedQuery = (
        'Experiment(id=302), Experiment.reaction_set, '
         + 'Reaction.dataset_set, Dataset.attachment_set'
      );

      // Fake constructor
      function Dataset() {}

      it('should return the empty string with no terms', function () {
        expect((new curious.CuriousQuery()).query()).to.equal('');
      });

      it('should return the correct query string', function () {
        var q = (new curious.CuriousQuery())
          .start('Experiment(id=302)', 'experiments')
          .follow('Experiment.reaction_set', 'reactions')
          .follow('Reaction.dataset_set', 'datasets').wrapWith(Dataset)
          .follow('Dataset.attachment_set', 'attachments');

        expect(q.query()).to.equal(expectedQuery);
      });

      it('should allow shortcuts', function () {
        // Terser version of the same query
        var q = new curious.CuriousQuery('Experiment(id=302)', 'experiment')
          .follow('Experiment.reaction_set', 'reactions')
          .follow('Reaction.dataset_set', 'dataset', Dataset)
          .follow('Dataset.attachment_set', 'attachments');

        expect(q.query()).to.equal(expectedQuery);
      });
    });

    describe('#start', function () {
      var startingTerm = 'Experiment(id=302)';

      // Fake constructor
      function Experiment() { return this; }
      function experimentFactory() { return Object.create(new Experiment()); }

      it('should start the query', function () {
        var q = (new curious.CuriousQuery()).start(startingTerm, 'experiments');

        expect(q.query()).to.equal(startingTerm);
      });

      it('should require both a term and a relationship', function () {
        expect(function () {
          (new curious.CuriousQuery()).start();
        }).to.throw(/term/);

        expect(function () {
          (new curious.CuriousQuery()).start(startingTerm);
        }).to.throw(/relationship/);
      });

      it('should allow custom constructors', function () {
        var q = (new curious.CuriousQuery())
          .start(startingTerm, 'experiments')
          .wrapWith(Experiment);

        expect(q.query()).to.equal(startingTerm);

        expect(q.objectFactories).to.have.length(1);
        expect(q.objectFactories[0]()).to.be.an.instanceof(Experiment);
      });

      it('should allow function factories', function () {
        var q = (new curious.CuriousQuery())
          .start(startingTerm, 'experiments')
          .wrapDynamically(experimentFactory);

        expect(q.query()).to.equal(startingTerm);

        expect(q.objectFactories).to.have.length(1);
        expect(q.objectFactories[0]()).to.be.an.instanceof(Experiment);
      });

      it('should allow shortcuts', function () {
        var q = new curious.CuriousQuery(startingTerm, 'experiments', Experiment);
        var q2 = new curious.CuriousQuery(startingTerm, 'experiments', experimentFactory);

        expect(q.query()).to.equal(startingTerm);

        expect(q.objectFactories).to.have.length(1);
        expect(q.objectFactories[0]()).to.be.an.instanceof(Experiment);

        expect(q2.objectFactories).to.have.length(1);
        expect(q2.objectFactories[0]()).to.be.an.instanceof(Experiment);
      });
    });


    describe('#follow', function () {
      var expectedQuery = 'Experiment(id=302), Experiment.reaction_set';
      var startingQuery;


      // Fake constructor
      function Experiment() { return this; }
      function Reaction() { return this; }
      function reactionFactory() { return Object.create(new Reaction()); }

      beforeEach(function () {
        startingQuery = new curious.CuriousQuery(
          'Experiment(id=302)', 'experiments', Experiment
        );
      });

      it('should append to the query with a comma', function () {
        var q = startingQuery
          .follow('Experiment.reaction_set', 'reactions');
        expect(q.query()).to.equal(expectedQuery);
      });

      it('should successfully allow terms without commas', function () {
        var q = startingQuery
          .follow('Experiment.reaction_set Reaction.dataset_set', 'datasets');

        expect(q.query()).to.equal(expectedQuery + ' Reaction.dataset_set');
      });

      it('should require both a term and a relationship', function () {
        expect(function () {
          startingQuery.follow();
        }).to.throw(/term/);

        expect(function () {
          startingQuery.follow('Experiment.reaction_set');
        }).to.throw(/relationship/);
      });

      it('should allow custom constructors', function () {
        var q = startingQuery
          .follow('Experiment.reaction_set', 'reactions')
          .wrapWith(Reaction);

        expect(q.query()).to.equal(expectedQuery);

        expect(q.objectFactories).to.have.length(2);
        expect(q.objectFactories[0]()).to.be.an.instanceof(Experiment);
        expect(q.objectFactories[1]()).to.be.an.instanceof(Reaction);
      });

      it('should allow function factories', function () {
        var q = startingQuery
          .follow('Experiment.reaction_set', 'reactions')
          .wrapDynamically(reactionFactory);

        expect(q.query()).to.equal(expectedQuery);

        expect(q.objectFactories).to.have.length(2);
        expect(q.objectFactories[0]()).to.be.an.instanceof(Experiment);
        expect(q.objectFactories[1]()).to.be.an.instanceof(Reaction);
      });

      it('should allow shortcuts', function () {
        var q = startingQuery.clone()
          .follow('Experiment.reaction_set', 'reactions', Reaction);
        var q2 = startingQuery.clone()
          .follow('Experiment.reaction_set', 'reactions', reactionFactory);

        expect(q.query()).to.equal(expectedQuery);

        expect(q.objectFactories).to.have.length(2);
        expect(q.objectFactories[0]()).to.be.an.instanceof(Experiment);
        expect(q.objectFactories[1]()).to.be.an.instanceof(Reaction);

        expect(q2.query()).to.equal(expectedQuery);

        expect(q2.objectFactories).to.have.length(2);
        expect(q2.objectFactories[0]()).to.be.an.instanceof(Experiment);
        expect(q2.objectFactories[1]()).to.be.an.instanceof(Reaction);
      });
    });

    describe('#with', function () {
      var expectedQuery = (
        'Experiment(id=302)'
        + ' ?(Experiment.compounds_of_interest)'
        + ' Experiment.reaction_set'
      );
      var startingQuery;

      // Fake constructor
      function Experiment() { return this; }
      function Reaction() { return this; }
      function Compound() { return this; }
      function compoundFactory() { return Object.create(new Compound()); }

      beforeEach(function () {
        startingQuery = new curious.CuriousQuery(
          'Experiment(id=302)', 'experiments', Experiment
        );
      });

      it('should append to the query with a groupng', function () {
        var q = startingQuery
          .with('Experiment.compounds_of_interest', 'compounds')
          .follow('Experiment.reaction_set', 'reactions');

        expect(q.query()).to.equal(expectedQuery);
      });

      it('should successfully allow terms without commas inside the group', function () {
        var q = startingQuery
          .with('Experiment.compounds_of_interest Compound.standard_set', 'standards')
          .follow('Experiment.reaction_set', 'reactions');

        expect(q.query()).to.equal(
          'Experiment(id=302)'
          + ' ?(Experiment.compounds_of_interest Compound.standard_set)'
          + ' Experiment.reaction_set'
        );
      });

      it('should require both a term and a relationship', function () {
        expect(function () {
          startingQuery.with();
        }).to.throw(/term/);

        expect(function () {
          startingQuery.with('Experiment.reaction_set');
        }).to.throw(/relationship/);
      });

      it('should allow custom constructors', function () {
        var q = startingQuery
          .with('Experiment.compounds_of_interest', 'compounds').wrapWith(Compound)
          .follow('Experiment.reaction_set', 'reactions').wrapWith(Reaction);

        expect(q.query()).to.equal(expectedQuery);

        expect(q.objectFactories).to.have.length(3);
        expect(q.objectFactories[0]()).to.be.an.instanceof(Experiment);
        expect(q.objectFactories[1]()).to.be.an.instanceof(Compound);
        expect(q.objectFactories[2]()).to.be.an.instanceof(Reaction);
      });

      it('should allow function factories', function () {
        var q = startingQuery
          .with('Experiment.compounds_of_interest', 'compounds')
            .wrapDynamically(compoundFactory)
          .follow('Experiment.reaction_set', 'reactions').wrapWith(Reaction);

        expect(q.query()).to.equal(expectedQuery);

        expect(q.objectFactories).to.have.length(3);
        expect(q.objectFactories[0]()).to.be.an.instanceof(Experiment);
        expect(q.objectFactories[1]()).to.be.an.instanceof(Compound);
        expect(q.objectFactories[2]()).to.be.an.instanceof(Reaction);
      });

      it('should allow shortcuts', function () {
        var q = startingQuery.clone()
          .with('Experiment.compounds_of_interest', 'compounds', Compound)
          .follow('Experiment.reaction_set', 'reactions').wrapWith(Reaction);
        var q2 = startingQuery.clone()
          .with('Experiment.compounds_of_interest', 'compounds', compoundFactory)
          .follow('Experiment.reaction_set', 'reactions').wrapWith(Reaction);

        expect(q.query()).to.equal(expectedQuery);

        expect(q.objectFactories).to.have.length(3);
        expect(q.objectFactories[0]()).to.be.an.instanceof(Experiment);
        expect(q.objectFactories[1]()).to.be.an.instanceof(Compound);
        expect(q.objectFactories[2]()).to.be.an.instanceof(Reaction);

        expect(q2.query()).to.equal(expectedQuery);

        expect(q2.objectFactories).to.have.length(3);
        expect(q2.objectFactories[0]()).to.be.an.instanceof(Experiment);
        expect(q2.objectFactories[1]()).to.be.an.instanceof(Compound);
        expect(q2.objectFactories[2]()).to.be.an.instanceof(Reaction);
      });
    });

    // having/notHaving should work basically the same way
    [
      {word: 'having', symbol: '+'},
      {word: 'notHaving', symbol: '-'},
    ].forEach(function (having) {
      describe('#' + having.word, function () {
        var havingClause = 'Experiment.compounds_of_interest(id=123)';
        var expectedQuery = 'Experiment ' + having.symbol + '(' + havingClause + ')';
        var startingQuery;

        beforeEach(function () {
          startingQuery = new curious.CuriousQuery(
            'Experiment', 'experiments'
          );
        });

        it('should append to the query with a "' + having.symbol + '"', function () {
          var q = startingQuery[having.word](havingClause);
          expect(q.query()).to.equal(expectedQuery);
        });

        it('should correctly insert into a query', function () {
          var q = startingQuery[having.word](havingClause)
            .follow('Experiment.reaction_set', 'reactions');
          expect(q.query()).to.equal(expectedQuery + ', Experiment.reaction_set');
        });
      });
    });

    describe('#setExistingObjects', function () {
      var query;
      var someObjects = [{a: 'b'}, {c: 'd', e: 'f'}, {g: 23}];

      beforeEach(function () {
        query = new curious.CuriousQuery();
      });

      it('should set the existingObjects property', function () {
        query.setExistingObjects(someObjects);
        expect(query.existingObjects).to.deep.equal(someObjects);
      });

      it('should make a one-level shallow copy', function () {
        query.setExistingObjects(someObjects);

        // one-level-deep assignments do not transfer
        someObjects[0] = 'moop';
        expect(query.existingObjects[0]).to.deep.equal({a: 'b'});

        // nested assigments do transfer, however
        someObjects[1].c = 'moop';
        expect(query.existingObjects).to.have.deep.property('[1].c', 'moop');
      });

      it('should do nothing if passed in nothing', function () {
        expect(query.existingObjects).to.be.null;
        query.setExistingObjects();
        expect(query.existingObjects).to.be.null;
      });
    });

    describe('#setParams', function () {
      var query;
      var someParams = {a: 'b', c: 'd', e: 'f', g: 23, h: {i: 'j'}};

      beforeEach(function () {
        query = new curious.CuriousQuery();
      });

      it('should set the params property', function () {
        query.setParams(someParams);
        expect(query.params).to.deep.equal(someParams);
      });

      it('should make a one-level shallow copy', function () {
        query.setParams(someParams);

        // one-level-deep assignments do not transfer
        someParams.a = 'moop';
        expect(query.params).to.have.property('a', 'b');

        // nested assigments do transfer, however
        someParams.h.i = 'moop';
        expect(query.params).to.have.deep.property('h.i', 'moop');
      });

      it('should do nothing if passed in nothing', function () {
        expect(query.params).to.be.null;
        query.setParams();
        expect(query.params).to.be.null;
      });
    });

    describe('#clone', function () {
      var excludedProperties;
      var originalQuery;

      // Fake constructor
      function Dataset() {}

      before(function () {
        excludedProperties = {
          objectFactories: 'object factory functions do not compare directly',
        };
      });

      beforeEach(function () {
        originalQuery = new curious.CuriousQuery('Experiment(id=302)', 'experiments')
          .with('Experiment.compounds_of_interest', 'compounds')
          .follow('Experiment.reaction_set', 'reactions')
          .having('Reaction.subjects(name="s481466")')
          .follow('Reaction.dataset_set', 'datasets', Dataset)
          .follow('Dataset.attachment_set', 'attachments');
      });

      it('should create the same query string', function () {
        expect(originalQuery.clone().query()).to.equal(originalQuery.query());
      });

      it('should clone the properties corretly', function () {
        Object.keys(originalQuery).forEach(function (property) {
          if (!excludedProperties.hasOwnProperty(property)) {
            expect(originalQuery.clone()[property])
              .to
              .deep
              .equal(originalQuery[property], 'Comparing: query.' + property);
          }
        });
      });

      it('should clone the object factories correctly', function () {
        var clonedObjectFactories = originalQuery.clone().objectFactories;

        originalQuery.objectFactories.forEach(function (factory, factoryIndex) {
          if (factory) {
            expect(Object.getPrototypeOf(clonedObjectFactories[factoryIndex]()))
              .to
              .deep
              .equal(Object.getPrototypeOf(factory()));
          }
        });
      });
    });

    describe('#extend', function () {
      var excludedProperties;
      var combinedQueryString = (
        'Experiment(id=302) ?(Experiment.compounds_of_interest)'
        + ' Experiment.reaction_set +(Reaction.subjects(name="s481466")),'
        + ' Reaction.dataset_set, Dataset.attachment_set'
      );
      var query1;
      var query2;

      // Fake constructor
      function Dataset() {}

      before(function () {
        excludedProperties = {
          objectFactories: 'functions do not compare well',
        };
      });

      beforeEach(function () {
        query1 = new curious.CuriousQuery('Experiment(id=302)', 'experiments')
          .with('Experiment.compounds_of_interest', 'compounds')
          .follow('Experiment.reaction_set', 'reactions')
          .having('Reaction.subjects(name="s481466")');

        query2 = new curious.CuriousQuery('Reaction.dataset_set', 'datasets', Dataset)
          .follow('Dataset.attachment_set', 'attachments');
      });

      it('should create the correct query string', function () {
        expect(query1.extend(query2).query()).to.equal(combinedQueryString);
      });

      it('should extend properties corretly', function () {
        var extendedQuery = query1.clone().extend(query2);

        Object.keys(query1).forEach(function (property) {
          if (
            !excludedProperties.hasOwnProperty(property)
            && (extendedQuery[property] instanceof Array)
          ) {
            expect(extendedQuery[property])
              .to
              .deep
              .equal(
                query1[property].concat(query2[property]),
                'Examining: extendedQuery.' + property
              );
          }
        });
      });

      it('should extend the object factories correctly', function () {
        var extendedQuery = query1.clone().extend(query2);
        var extendedObjectFactories = query1.objectFactories.concat(query2.objectFactories);

        extendedQuery.objectFactories.forEach(function (factory, factoryIndex) {
          if (factory) {
            expect(Object.getPrototypeOf(extendedObjectFactories[factoryIndex]()))
              .to
              .deep
              .equal(Object.getPrototypeOf(factory()));
          }
        });
      });
    });

    describe('#perform', function () {
      var curiousClient;

      before(function () {
        // Make a mock CuriousClient class
        function MockCuriousClient() { }

        MockCuriousClient.prototype.performQuery = function () {
          return 'some arbitrary value';
        };

        curiousClient = new MockCuriousClient();
      });

      it('should return whatever CuriousClient#performQuery does', function () {
        var q = new curious.CuriousQuery();
        expect(q.perform(curiousClient)).to.equal(curiousClient.performQuery());
      });
    });

    describe('#then', function () {
      var validClient;
      var invalidClient;
      var srv;

      before(function (done) {
        validClient = new curious.CuriousClient(
          server.url,
          curious.CuriousClient.wrappers.axios(axios),
          null,
          true,
          true
        );

        invalidClient = new curious.CuriousClient(
          'INVALID URL',
          curious.CuriousClient.wrappers.axios(axios),
          null,
          true,
          true
        );

        srv = server.start(done);
        return srv;
      });

      after(function (done) {
        srv.close(done);
      });

      it('should attach callbacks on fulfilled promises', function (done) {
        try {
          var q = new curious.CuriousQuery().then(function (response) {
            expect(response).to.be.ok;
            done();
          }, done);
          q.perform(validClient);
        } catch (error) {
          done(error);
        }
      });

      it('should attach callbacks on rejected promises', function (done) {
        try {
          var q = new curious.CuriousQuery().then(function () {
            throw new Error('Incorrectly called fulfilled handler');
          }, function (error) {
            expect(error).to.be.ok;
            done();
          });
          q.perform(invalidClient);
        } catch (error) {
          done(error);
        }
      });
    });

    describe('#catch', function () {
      var invalidClient;

      before(function () {
        invalidClient = new curious.CuriousClient(
          'INVALID URL',
          curious.CuriousClient.wrappers.axios(axios),
          null,
          true,
          true
        );
      });

      it('should attach callbacks on rejected promises', function (done) {
        try {
          var q = new curious.CuriousQuery().catch(function (error) {
            expect(error).to.be.ok;
            done();
          });
          q.perform(invalidClient);
        } catch (error) {
          done(error);
        }
      });
    });
  });
}());
