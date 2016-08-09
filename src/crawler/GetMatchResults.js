let debug = console.log.bind(console, '[crawler/GetMatchResults]');
let getThroughCache = require('./getThroughCache');
let load = require('./load');
let stream = require('stream');

class GetMatchResults extends stream.Writable {
 constructor() {
    super({objectMode: true});
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
    let doc;
    try {
      let html = await getThroughCache(event.link);
      let window = await load(html);
      doc = window.document;
    } catch (error) {
      debug(error);
    }

    switch (event.reporter) {
      case 'SCG':
        return await getScgMatchResults(event);
      case 'WotC':
        return await getWizardsMatchResults(event);
    }
  }
}

async function getScgMatchResults(event) {
  // TODO
}

async function getWizardsMatchResults(event) {
  // TODO
}

module.exports = GetMatchResults;
