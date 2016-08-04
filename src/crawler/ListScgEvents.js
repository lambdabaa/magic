/**
 * Pulls all of the events from http://www.starcitygames.com/content/archive.
 */
let btoa = require('btoa');
let flatten = require('lodash/array/flatten');
let formatEvent = require('./formatEvent');
let getThroughCache = require('./getThroughCache');
let load = require('./load');
let moment = require('moment');
let stream = require('stream');

class ListScgEvents extends stream.Readable {
  constructor() {
    super({objectMode: true});
    this._buffer = null;
  }

  async _read() {
    if (!this._buffer) {
      let html = await getThroughCache('http://www.starcitygames.com/content/archive');
      let window = await load(html);
      let doc = window.document;
      let elements = Array.from(doc.getElementsByClassName('scgop-event'));
      this._buffer = flatten(
        elements.map(element => {
          let link = element.querySelector('.event-left a');

          let year;
          for (let parent = element; parent != null; parent = parent.parentNode) {
            switch (parent.id) {
              case 'year-2014':
                year = 2014;
                break;
              case 'year-2015':
                year = 2015;
                break;
              case 'year-2016':
                year = 2016;
                break;
            }

            if (year != null) {
              break;
            }
          }

          let icon = element.querySelector('.event-icon');
          let mana = element.querySelector('.event-mana');
          let [match, month, day] = /([A-Z][a-z]+)\s*([0-9])+/.exec((icon || mana).textContent.trim());
          let date = moment(
            `${month} ${day} ${year}`,
            'MMM DD YYYY'
          )
          .valueOf();

          return [
            'Legacy',
            'Modern',
            'Standard'
          ]
          .filter(format => {
            return new RegExp(format).test(element.textContent);
          })
          .map(format => {
            return {
              reporter: 'SCG',
              date: isNaN(date) ? 0 : date,
              format,
              link: link ? link.href : null,
              location: link ? link.textContent : null
            };
          });
        })
      );
    }

    while (this._buffer.length && this.push(this._buffer.pop())) {}

    if (!this._buffer.length) {
      this.push(null);
    }
  }
}

module.exports = ListScgEvents;
