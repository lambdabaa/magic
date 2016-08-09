let Combine = require('../../src/crawler/Combine');
let assert = require('assert');
let stream = require('stream');

test('Combine', done => {
  let expected = 'foobar';
  let result = '';
  let a = new stream.PassThrough();
  let b = new stream.PassThrough();

  let combine = new Combine(a, b);
  combine.on('data', chunk => result += chunk);
  combine.on('end', () => {
    assert.equal(result, expected);
    done();
  });

  a.write('f');
  b.write('o');
  a.write('o');
  b.write('b');
  a.write('a');
  b.write('r');
  process.nextTick(() => {
    b.end();
    process.nextTick(() => {
      a.end();
    });
  });
});
