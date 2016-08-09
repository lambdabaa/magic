let assert = require('assert');
let getCommonPrefixAndSuffix = require('../src/getCommonPrefixAndSuffix');

suite('getCommonPrefixAndSuffix', () => {
  test('prefix only', () => {
    assert.deepEqual(
      getCommonPrefixAndSuffix([
        'June 01',
        'June 08',
        'June 15',
        'June 22',
        'June 29'
      ]),
      {prefix: 'June ', suffix: ''}
    );
  });

  test('suffix only', () => {
    assert.deepEqual(
      getCommonPrefixAndSuffix([
        'Jan 21, 2016',
        'Feb 21, 2016',
        'Mar 21, 2016'
      ]),
      {prefix: '', suffix: ' 21, 2016'}
    );
  });

  test('both prefix and suffix', () => {
    assert.deepEqual(
      getCommonPrefixAndSuffix([
        'bob1dole',
        'bob20dole',
        'bob300dole',
        'bob4000dole',
        'bob50000dole'
      ]),
      {prefix: 'bob', suffix: 'dole'}
    );
  });

  test('no common prefix or suffix', () => {
    assert.deepEqual(
      getCommonPrefixAndSuffix([
        'bob1dole',
        'bob20dole',
        'bob300dole',
        'bob4000dole',
        'bob50000dole',
        'merp'
      ]),
      {prefix: '', suffix: ''}
    );
  });
});
