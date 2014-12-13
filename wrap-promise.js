/*!
 * wrap-promise | MIT (c) Shinnosuke Watanabe
 * https://github.com/shinnn/wrap-promise
*/
window.wrapPromise = function wrapPromise(fn) {
  'use strict';

  if (typeof fn !== 'function') {
    throw new TypeError(fn + ' is not a function. Argument must be a function.');
  }

  var resolve;
  var reject;

  var promise = new window.wrapPromise.Promise(function(_resolve, _reject) {
    resolve = _resolve;
    reject = _reject;
  });

  fn(resolve, reject);

  return promise;
};

window.wrapPromise.Promise = window.Promise;
if (!window.wrapPromise.Promise) {
  throw new TypeError('Promise constructor must be provided as window.Promise.');
}
