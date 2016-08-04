let Firebase = require('firebase');
let btoa = require('btoa');
let debug = console.log.bind(console, '[crawler/PersistEvent]');
let formatEvent = require('./formatEvent');
let stream = require('stream');

let ref = new Firebase('https://mtgstats.firebaseio.com/events');

class PersistEvent extends stream.Writable {
  constructor() {
    super({objectMode: true});
    this.count = 0;
    this.oldest = null;
    this.newest = null;
    this.once('finish', () => {
      debug(`Found ${this.count} events`);
      debug('Oldest', formatEvent(this.oldest));
      debug('Newest', formatEvent(this.newest));
    });
  }

  async _write(event, encoding, callback) {
    try {
      await this._writeEvent(event);
    } catch (error) {
      return callback(error);
    }

    callback();
  }

  async _writev(chunks, callback) {
    try {
      await Promise.all(chunks.map(chunk => this._writeEvent(chunk.chunk)));
    } catch (error) {
      return callback(error);
    }

    callback();
  }

  async _writeEvent(event) {
    this.count++;

    if (typeof event.date === 'number' && event.date > new Date(2012)) {
      if (!this.oldest || event.date < this.oldest.date) {
        this.oldest = event;
      }

      if (!this.newest || event.date > this.newest.date) {
        this.newest = event;
      }
    }

    if (!event || typeof event.link !== 'string' || !event.link.length) {
      debug('Missing link', formatEvent(event));
      return;
    }

    let key = btoa(event.link);
    let child = ref.child(key);
    let snapshot = await child.once('value');
    if (snapshot.exists()) {
      return;
    }

    debug('Write', formatEvent(event));
    await child.set(event);
  }
}

module.exports = PersistEvent;
