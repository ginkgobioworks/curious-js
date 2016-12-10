# curious-js

JavaScript consumer code for Curious APIs.

[![Build Status](https://travis-ci.org/ginkgobioworks/curious-js.svg?branch=v2)](https://travis-ci.org/ginkgobioworks/curious-js)

## Usage

### Installation

`curious-js` is available both from [bower](https://bower.io/search/?q=curious-js) and from
[npm](https://www.npmjs.com/package/curious-js).

### Importing

`curious-js` has been written using the [UMD](https://github.com/umdjs/umd) module pattern. This
pattern should be compatible with AMD/require.js, CommonJS/node.js, direct loading in the browser,
and Babel module variants. Requiring or loading the `curious.js` file will create a module (with the
default name `curious`) in whatever system you are using.

### Using

There are two main parts to using Curious from JavaScript: `CuriousClient` and `CuriousQuery`.

First, create an instance of `CuriousClient` that points to your Curious server, providing a
server URL and a request function.

_The server URL provided to the client should point to the Curious root endpoint, **not** to the
query endpoint (`/q/`) on the server_. The code will not break if you make this mistake, but the
behavior is deprecated.

You must also provide a request method. You are responsible for picking and using a request
method/transport layer that works for you. `CuriousClient` provides convenience wrappers for
common request methods, but you can make any asynchronous transport layer work by passing a custom
function as the second parameter to the client constructor. The function must take the URL as its
first parameter and an object payload as its second parameter, make a `POST` request to the curious
server, and return a Promise (or any thenable) that resolves to the JSON data returned by the
server. Note that if you're using jQuery, `jQuery.post` does not require any wrapping and can be
passed as the second parameter directly.

```javascript
// Example using Axios
var curiousClient = new curious.CuriousClient(CURIOUS_URL, curious.CuriousClient.wrappers.axios(axios), ...);

// Example using a custom request method
var curiousClient = new curious.CuriousClient(CURIOUS_URL, function (url, data) {
  return new Promise(function (resolve, reject) {
    var result;
    var error;

    // Perform some asynchronous access

    if (error) {
      reject(error);
    } else {
      resolve(result);
    }
  });
}, ...);
```

Then, construct a `CuriousQuery` and perform it on the server using the client. Attach any callbacks
to the Promise object returned by the `perform` method, or directly to the query object. They will
be executed in the order they were attached, before any callbacks attached later. The results of the
query will be passed to the first callback.

Here's a trivial example. The results, of course, depend on the schema on the Curious server; the
example uses a made up schema consiting of Document and Section entities in a 1:many relationship.

```javascript
// A simple node.js use case; works similarly on the front end, minus module loading

const util = require('util');
const axios = require('axios');
const curious = require('curious');

// Define a client to connect to a curious server
const client = new curious.CuriousClient(
 'http://your-curious.com',
  curious.CuriousClient.wrappers.axios(axios),
  null, // serverArgs
  true, // quiet
  true  // camelCase
);

// The schema here is a simple 1:many relationship

// Make a query
const q = new curious.CuriousQuery('Document(id=12345)', 'documents')
  .follow('Document.section_set', 'sections');

// Perform that query with the client
q.perform(client).then((data) => {

  // In the callback, examine the resulting data
  try {
    console.log('data:');
    console.log(data);

    console.log('data.objects:');
    console.log(data.objects);

    console.log('data.objects.documents:');
    console.log(data.objects.documents);

    console.log('data.objects.documents[0].sections:');
    console.log(data.objects.documents[0].sections);

    console.log('data.objects.documents[0].sections[0].documents[0]:');
    console.log(data.objects.documents[0].sections[0].documents[0]);

    console.log('data.objects.sections:');
    console.log(data.objects.sections);

    console.log('data.objects.sections[0].documents:');
    console.log(data.objects.sections[0].documents);

    console.log('data.objects.sections[0].documents[0].sections[0]:');
    console.log(data.objects.sections[0].documents[0].sections[0]);
  } catch (e) {
    console.error(e);
  }

  return data;
}, console.error);
```

The output from the example code above would look something like this, depending on the data:
```javascript
data:
{ objects: { documents: [ [Object] ], sections: [ [Object], [Object] ] },
  trees: [ null, null ] }

data.objects:
{ documents:
   [ CuriousObject {
       __url: 'http://your-curious.com/document/12345',
       __model: 'Document',
       id: 12345,
       ...
       sections: [Object] } ],
  sections:
   [ CuriousObject {
       __url: null,
       __model: 'Section',
       id: 12205,
       documentId: 12345,
       ...
       documents: [Object] },
     CuriousObject {
       __url: null,
       __model: 'Section',
       id: 112403,
       documentId: 12345,
       ...
       documents: [Object] } ] }

data.objects.documents:
[ CuriousObject {
    __url: 'http://your-curious.com/document/12345',
    __model: 'Document',
    id: 12345,
    ...
    sections: [ [Object], [Object] ] } ]

data.objects.documents[0].sections:
[ CuriousObject {
    __url: null,
    __model: 'Section',
    id: 12205,
    documentId: 12345,
    ...
    documents: [ [Object] ] },
  CuriousObject {
    __url: null,
    __model: 'Section',
    id: 112403,
    documentId: 12345,
    ...
    documents: [ [Object] ] } ]

data.objects.documents[0].sections[0].documents[0]:
CuriousObject {
  __url: 'http://your-curious.com/document/12345',
  __model: 'Document',
  id: 12345,
  ...
  sections:
   [ CuriousObject {
       __url: null,
       __model: 'Section',
       id: 12205,
       documentId: 12345,
       ...
       documents: [Object] },
     CuriousObject {
       __url: null,
       __model: 'Section',
       id: 112403,
       documentId: 12345,
       ...
       documents: [Object] } ] }

data.objects.sections:
[ CuriousObject {
    __url: null,
    __model: 'Section',
    id: 12205,
    documentId: 12345,
    ...
    documents: [ [Object] ] },
  CuriousObject {
    __url: null,
    __model: 'Section',
    id: 112403,
    documentId: 12345,
    ...
    documents: [ [Object] ] } ]

data.objects.sections[0].documents:
[ CuriousObject {
    __url: 'http://your-curious.com/document/12345',
    __model: 'Document',
    id: 12345,
    ...
    sections: [ [Object], [Object] ] } ]

data.objects.sections[0].documents[0].sections[0]:
CuriousObject {
  __url: null,
  __model: 'Section',
  id: 12205,
  documentId: 12345,
  ...
  documents:
   [ CuriousObject {
       __url: 'http://your-curious.com/document/12345',
       __model: 'Document',
       id: 12345,
       ...
       sections: [Object] } ] }
```

The API is explained in detail in the documentation.

## Development

Development is carried out through an included Docker environment and Travis CI.


### CI

Continuous integration is performed with [Travis CI](https://travis-ci.org/ginkgobioworks/curious-js).
And any tagged commits on the main branch (v2), which update bower by default, are also automatically
deployed to NPM.

Minification and source map generation happens automatically and the minified code is deployed to
both npm and bower. No minified code should be checked in.

### Docker

The project provides a Dockerfile that builds a container capable of running the unit tests and
scripts. To run the tests, bring up the container with `docker-compose up`. Any of the scripts shown
to be run below from a shell with `npm run` can be executed in an instance of the container with
`docker-compose run --rm [script name]`.

### REPL

A script that opens up a node.js REPL and loads curious.js as `curious` is available via
`npm run repl`.

### Test framework

The tests are written in [mocha](https://mochajs.org/), with [chai](http://chaijs.com/) expect-style
assertions. Tests can be run with `npm test`.

Coding conventions and linting are enforced at the unit test level but can also be run independently
with `npm run lint`.

### Documentation

Any new code added to `curious.js` must be documented in a manner consistent with existing
documentation.

JSDoc documentation can be generated into the `doc/` subdirectory from the source code and README
with `npm run make_doc`. It can be updated on the project website automatically with `npm run
release_doc`.
