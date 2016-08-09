let stream = require('stream');

function multipipe(src, dests) {
  dests.forEach(dest => {
    src
      .pipe(new stream.PassThrough())
      .pipe(dest);
  });
}

module.exports = multipipe;
