let filter = require('lodash/collection/filter');
let groupBy = require('lodash/collection/groupBy');

function filterResults(obj, name) {
  return groupBy(
    filter(obj, match => {
      return typeof match.date === 'number' &&
             match.date > 0 &&
             match.p1 !== match.p2 &&
             (match.p1 === name || match.p2 === name);
    }),
    match => {
      return name === match.p1 ? match.p2 : match.p1;
    }
  );
}

module.exports = filterResults;
