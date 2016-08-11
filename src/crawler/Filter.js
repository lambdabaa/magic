let stream = require('stream');

class Filter extends stream.Duplex {
  constructor(test) {
    super({objectMode: true});
    this._buffer = [];
    this._isReading = false;
    this._test = test;
  }

  _write(chunk, encoding, callback) {
    if (this._test(chunk)) {
      if (this._isReading) {
        this._isReading = this.push(chunk);
      } else {
        this._buffer.push(chunk);
      }
    }

    callback();
  }

  _read() {
    this._isReading = true;
    while (this._isReading && this._buffer.length) {
      this._isReading = this.push(this._buffer.pop());
    }
  }
}

module.exports = Filter;
