let forEach = require('lodash/collection/forEach');

function filter(obj, fn) {
  let result = {};
  forEach(obj, (value, key) => {
    if (fn(value, key)) {
      result[key] = value;
    }
  });

  return result;
}

module.exports = filter;
