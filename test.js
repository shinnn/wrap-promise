'use strict';

var fs = require('fs');
var path = require('path');

var es6Promise = require('es6-promise').Promise;
var requireUncached = require('require-uncached');
var test = require('tape');

var bowerMainPath = path.resolve(require('./bower.json').main);

function runTest(description, requireWrapPromise, supported) {
  test(description, function(t) {
    if (!supported) {
      t.throws(
        requireWrapPromise,
        /TypeError.*Promise constructor must be provided/,
        'should throw a type error when Promise isn\'t provided as a global function.'
      );
      t.end();
      return;
    }

    t.plan(6);

    var wrapPromise = requireWrapPromise();
    t.equal(wrapPromise.name, 'wrapPromise', 'should have a function name.');

    var readFile = function(filePath) {
      return wrapPromise(function(resolve, reject) {
        fs.readFile(filePath, function(err, buf) {
          if (err) {
            reject(err);
            return;
          }
          resolve(buf);
        });
      });
    };

    readFile('.gitattributes').then(function(buf) {
      t.equal(
        buf.toString(),
        '* text=auto\n',
        'should provide .then() method to the returned object.'
      );
    });

    readFile('__this_file_does_not_exists__').catch(function(err) {
      t.equal(err.code, 'ENOENT', 'should provide .catch() method to the returned object.');
    });

    t.throws(
      readFile.bind(null, [__dirname]),
      /TypeError.*path/,
      'should immediately throw an error when an error is thrown in the function.'
    );

    t.throws(
      wrapPromise.bind(null, {'this': {is: {not: {a: {'function': '.'}}}}}),
      /TypeError.*must be a function/,
      'should throw a type error when the argument is not a function.'
    );

    t.throws(
      wrapPromise.bind(null),
      /TypeError.*must be a function/,
      'should throw a type error when it takes no arguments.'
    );
  });
}

var env = ' without global.Promise';

runTest('require(\'wrap-promise\')' + env, function() {
  global.Promise = null;
  return requireUncached('./');
}, true);
runTest('require(\'wrap-promise/no-fallback\')' + env, function() {
  global.Promise = null;
  return requireUncached('./no-fallback');
}, false);

env = ' with global.Promise';

runTest('require(\'wrap-promise\')' + env, function() {
  global.Promise = es6Promise;
  return require('./');
}, true);
runTest('require(\'wrap-promise/no-fallback\')' + env, function() {
  global.Promise = es6Promise;
  return require('./no-fallback');
}, true);

runTest('window.wrapPromise without window.Promise', function() {
  global.window = {};
  requireUncached(bowerMainPath);
}, false);

runTest('window.wrapPromise with window.Promise', function() {
  global.window = {Promise: es6Promise};
  requireUncached(bowerMainPath);
  return window.wrapPromise;
}, true);
