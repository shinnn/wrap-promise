'use strict';

const fs = require('fs');
const path = require('path');

const es6Promise = require('es6-promise').Promise;
const requireUncached = require('require-uncached');
const test = require('tape');

const bowerMainPath = path.resolve(require('./bower.json').main);

function runTest(description, requireWrapPromise, supported) {
  test(description, t => {
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

    const wrapPromise = requireWrapPromise();
    t.equal(wrapPromise.name, 'wrapPromise', 'should have a function name.');

    function readFile(filePath) {
      return wrapPromise(function(resolve, reject) {
        fs.readFile(filePath, function(err, buf) {
          if (err) {
            reject(err);
            return;
          }
          resolve(buf);
        });
      });
    }

    readFile('.gitattributes').then(buf => {
      t.equal(
        String(buf),
        '* text=auto\n',
        'should provide .then() method to the returned object.'
      );
    }).catch(t.fail);

    readFile('__this_file_does_not_exists__').catch(err => {
      t.equal(err.code, 'ENOENT', 'should provide .catch() method to the returned object.');
    }).catch(t.fail);

    t.throws(
      () => readFile([__dirname]),
      /TypeError.*path/,
      'should immediately throw an error when an error is thrown in the function.'
    );

    t.throws(
      () => wrapPromise({This: {is: {not: {a: {function: '.'}}}}}),
      /TypeError.*must be a function/,
      'should throw a type error when the argument is not a function.'
    );

    t.throws(
      () => wrapPromise(),
      /TypeError.*must be a function/,
      'should throw a type error when it takes no arguments.'
    );
  });
}

let env = ' without global.Promise';

runTest('require(\'wrap-promise\')' + env, () => {
  global.Promise = null;
  return requireUncached('./');
}, true);
runTest('require(\'wrap-promise/no-fallback\')' + env, () => {
  global.Promise = null;
  return requireUncached('./no-fallback');
}, false);

env = ' with global.Promise';

runTest('require(\'wrap-promise\')' + env, () => {
  global.Promise = es6Promise;
  return require('./');
}, true);
runTest('require(\'wrap-promise/no-fallback\')' + env, () => {
  global.Promise = es6Promise;
  return require('./no-fallback');
}, true);

runTest('window.wrapPromise without window.Promise', () => {
  global.window = {};
  requireUncached(bowerMainPath);
}, false);

runTest('window.wrapPromise with window.Promise', () => {
  global.window = {Promise: es6Promise};
  requireUncached(bowerMainPath);
  return window.wrapPromise;
}, true);
