require('babel-polyfill');

require('babel-core/register')(
  JSON.parse(
    require('fs').readFileSync(
      __dirname + '/../.babelrc'
    )
  )
);
