let assert = require('assert');
let formatEvent = require('../../src/crawler/formatEvent');

test('formatEvent', () => {
  assert.equal(
    formatEvent({
      reporter: 'WotC',
      location: 'Portland',
      date: new Date(2016, 1, 6)
    }),
    'WotC Portland 2016'
  );
});
