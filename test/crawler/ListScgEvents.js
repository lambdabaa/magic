let ListScgEvents = require('../../src/crawler/ListScgEvents');
let assert = require('assert');

test('ListScgEvents', done => {
  let result = [];
  let stream = new ListScgEvents();
  stream.on('data', chunk => result.push(chunk));
  stream.on('end', () => {
    assert.ok(result.length > 150);
    result.forEach(checkEvent);
    done();
  });
});

function checkEvent(event) {
  assert.equal(event.reporter, 'SCG');
  assert.ok(typeof event.date === 'number');
  assert.ok(['Standard', 'Modern', 'Legacy'].includes(event.format));
  assert.notEqual(event.link, null);
  assert.ok(typeof event.location === 'string');
}
