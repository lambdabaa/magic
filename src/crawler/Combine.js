let stream = require('stream');
let waitForEvent = require('../waitForEvent');

class Combine extends stream.PassThrough {
  constructor(...streams) {
    super({objectMode: true});

    Promise.all(
      streams.map(stream => {
        stream.pipe(this, {end: false});
        return waitForEvent(stream, 'end');
      })
    )
    .then(() => this.end());
  }
}

module.exports = Combine;
