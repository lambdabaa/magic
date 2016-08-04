/**
 * Pulls all of the events from http://magic.wizards.com/en/events/coverage.
 */
let btoa = require('btoa');
let formatEvent = require('./formatEvent');
let getThroughCache = require('./getThroughCache');
let load = require('./load');
let moment = require('moment');
let stream = require('stream');

class ListWizardsEvents extends stream.Readable {
  constructor() {
    super({objectMode: true});
    this._buffer = null;
  }

  async _read() {
    if (!this._buffer) {
      let html = await getThroughCache('http://magic.wizards.com/en/events/coverage');
      let window = await load(html);
      let doc = window.document;
      let elements = Array.from(doc.getElementsByTagName('a')).filter(element => {
        if (!/[a-z]/.test(element.textContent)) {
          // Needs a lowercase letter
          return false;
        }

        // e.g. gpdet16, ptsoi, 2015mwc
        if (!/[a-z]1[3-6]/.test(element.href) &&
            !/\/pt[a-z0-9]+\/?$/.test(element.href) &&
            !/\/201[3-6][a-z]+\/?$/.test(element.href)) {
          return false;
        }

        let adjacent = element.nextSibling.textContent;
        if (element.nextSibling.nextSibling) {
          adjacent += element.nextSibling.nextSibling.textContent;
        }

        return /\([A-Za-z]+\s[1-9]+\-.+\,\s201[3-6]\)[^A-Za-z]+(Legacy|Modern|Standard)/.test(adjacent);
      });

      this._buffer = elements.map(element => {
        let adjacent = element.nextSibling.textContent;
        if (element.nextSibling.nextSibling) {
          adjacent += element.nextSibling.nextSibling.textContent;
        }

        let [match, month, day, year, format] =
          /\(([A-Za-z]+)\s([1-9]+)\-.+\,\s(201[3-6])\)[^A-Za-z]+(Legacy|Modern|Standard)/.exec(adjacent);
        let date = moment(
          `${month} ${day}, ${year}`,
          'MMMM DD, YYYY'
        )
        .valueOf();

        let link = element.href.startsWith('http') ?
          element.href :
          'http://magic.wizards.com' + element.href;
        return {
          reporter: 'WotC',
          date: isNaN(date) ? 0 : date,
          format,
          link,
          location: element.textContent
        };
      });
    }

    while (this._buffer.length && this.push(this._buffer.pop())) {
    }

    if (!this._buffer.length) {
      this.push(null);
    }
  }
}

module.exports = ListWizardsEvents;
