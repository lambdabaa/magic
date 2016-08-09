let ListWizardsEvents = require('../../src/crawler/ListWizardsEvents');
let assert = require('assert');

test('ListWizardsEvents', done => {
  let result = [];
  let stream = new ListWizardsEvents();
  stream.on('data', chunk => result.push(chunk));
  stream.on('end', () => {
    assert.ok(result.length > 50);
    result.forEach(checkEvent);
    done();
  });
});

function checkEvent(event) {
  assert.equal(event.reporter, 'WotC');
  assert.ok(typeof event.date === 'number');
  assert.ok(['Standard', 'Modern', 'Legacy'].includes(event.format));
  assert.notEqual(event.link, null);
  assert.ok(typeof event.location === 'string');
}
