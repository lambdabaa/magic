let Firebase = require('firebase');
let debug = console.log.bind(console, '[crawler/SaveEventToFirebase]');
let formatEvent = require('./formatEvent');
let hashUrl = require('../hashUrl');
let maybeset = require('../maybeset');
let stream = require('stream');

let firebaseSecretToken = 'tTxh4X9b1gGIySp4XvSFvuTcf50Pt0XnSxoCYN49';
let ref = new Firebase('https://mtgstats.firebaseio.com/events');

class SaveEventToFirebase extends stream.Transform {
  constructor() {
    super({objectMode: true});
    this._count = 0;
    this._oldest = null;
    this._newest = null;
    this._auth = this._authenticate();
  }

  async _transform(event, encoding, callback) {
    try {
      await this._saveEvent(event);
    } catch (error) {
      debug(error);
      return callback(error);
    }

    callback(null, event);
  }

  async _saveEvent(event) {
    // Err...
    //await this._auth;
    this._updateStats(event);

    if (!event || typeof event.link !== 'string' || !event.link.length) {
      debug('Missing link', formatEvent(event));
      return;
    }

    let key = hashUrl(event.link);
    let child = ref.child(key);
    await maybeset(child, event);
  }

  _authenticate() {
    return ref.authWithCustomToken(firebaseSecretToken);
  }

  _updateStats(event) {
    this._count++;

    if (typeof event.date === 'number' && event.date > new Date(2012)) {
      if (!this._oldest || event.date < this._oldest.date) {
        this._oldest = event;
      }

      if (!this._newest || event.date > this._newest.date) {
        this._newest = event;
      }
    }
  }
}

module.exports = SaveEventToFirebase;
