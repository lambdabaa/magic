let Firebase = require('firebase');
let debug = console.log.bind(console, '[crawler/GetDecklists]');
let flatten = require('lodash/array/flatten');
let getCommonPrefixAndSuffix = require('../getCommonPrefixAndSuffix');
let getThroughCache = require('./getThroughCache');
let formatEvent = require('./formatEvent');
let hashUrl = require('../hashUrl');
let load = require('./load');
let maybeset = require('../maybeset');
let stream = require('stream');

let ref = new Firebase('https://mtgstats.firebaseio.com/events');

class GetDecklists extends stream.Transform {
  constructor() {
    super({objectMode: true});
    this._count = 0;
    this._failures = [];
  }

  async _transform(event, encoding, callback) {
    debug(JSON.stringify(event));
    let decklists;
    try {
      decklists = await this._getDecklists(event);
      if (!decklists.length) {
        this._failures.push(event.link);
        return callback();
      }

      await Promise.all(
        decklists.map((decklist, index) => {
          decklist.date = event.date;
          decklist.format = event.format;
          decklist.link = event.link;
          decklist.location = event.location;

          for (let key in decklist) {
            if (decklist[key] == null) {
              delete decklist[key];
            }
          }

          let loc = ref
            .child(hashUrl(event.link))
            .child('decklists')
            .child('' + index)
          return maybeset(loc, decklist);
        })
      );

      this._count += decklists.length;
    } catch (error) {
      this._failures.push(event.link);
      debug(error);
      return callback();
    }

    event.decklists = decklists;
    callback(null, event);
  }

  async _getDecklists(event) {
    let doc;
    try {
      let html = await getThroughCache(event.link);
      let window = await load(html);
      doc = window.document;
    } catch (error) {
      //debug(error);
      return [];
    }

    try {
      switch (event.reporter) {
        case 'SCG':
          return await getScgDecklists(event, doc);
        case 'WotC':
          return await getWizardsDecklists(event, doc);
      }
    } catch (error) {
      //debug(error);
      return [];
    }
  }
}

async function getScgDecklists(event, overview) {
  let decklists = await Promise.all(
    Array
      .from(overview.getElementById('tabs').children)
      .filter(tab => {
        return [
          event.format,
          'Saturday',
          'Sunday',
          'Day'
        ].some(x => tab.id.includes(x));
      })
      .map(getScgTabDecklists)
  );

  return flatten(decklists);
}

function getScgTabDecklists(tab) {
  let links = Array
    .from(tab.getElementsByTagName('a'))
    .filter(aLink => aLink.href.toLowerCase().includes('deckl'));
  let link;
  if (links.length > 1) {
    link = links.find(aLink => {
      return aLink.textContent.includes(tab.id) ||
             aLink.href.includes(tab.id.toLowerCase());
    });
  }

  link = link || links[0];
  return getScgLinkDecklists(link);
}

async function getScgLinkDecklists(link) {
  let href = link.href.startsWith('http') ?
    link.href :
    'http://starcitygames.com' + link.href;
  let html = await getThroughCache(href);
  let window = await load(html);
  let doc = window.document;
  let next = Array
    .from(doc.getElementsByTagName('a'))
    .find(aLink => aLink.textContent.includes('Next>'));

  let result = [];
  if (next) {
    let more = await getScgLinkDecklists(next);
    result = result.concat(more);
  }

  let list = Array
    .from(doc.querySelectorAll('#content table tr'))
    .filter(row => {
      return row.children.length === 7 &&
             row.children[0].className.includes('deckdbbody');
    })
    .map(row => {
      return {
        link: row.children[0].children[0].href,
        name: row.children[0].textContent,
        player: row.children[2].textContent
      };
    });

  return result.concat(list);
}

async function getWizardsDecklists(event, overview) {
  let articles = Array
    .from(overview.querySelectorAll('#tabs-0 .article-item'))
    .filter(article => {
      let title = article.getElementsByClassName('title')[0];
      let text = title.textContent.toLowerCase();
      return text.includes('decklists') || text.includes('decks');
    })
    .map(article => {
      let link = article.getElementsByTagName('a')[0];
      return link.href.startsWith('http') ?
        link.href :
        'http://magic.wizards.com' + link.href;
    });

  let decks = await Promise.all(
     articles.map(async (link) => {
      let html = await getThroughCache(link);
      let window = await load(html);
      let doc = window.document;
      try {
      return trimBoilerplate(
        Array
          .from(doc.getElementsByClassName('deck-meta'))
          .map(meta => meta.textContent)
      )
      .map(meta => {
        let raw = meta;
        meta = meta
          .replace(/\d+st/g, '')
          .replace(/\d+nd/g, '')
          .replace(/\d+rd/g, '')
          .replace(/\d+th/g, '')
          .replace(/\s*\.\s*/g, '')
          .replace(/\s*(P|p)lace\s*/g, '')
          .replace(/–\s+(A|a)t/g, '')
          .replace(/\d+$/g, '')
          .trim();
        let player, name;
        let parse = [
          ' by ',
          '\'s',
          '\'',
          String.fromCharCode(8211),
          String.fromCharCode(8212),
          '- ',
          '(',
          ':',
          '-'
        ].some(separator => {
          if (!meta.includes(separator)) {
            return false;
          }

          let parts = meta
            .split(separator)
            .map(part => part.trim().split(/\s+/).join(' '))
            .filter(part => !!part.length);

          switch (separator) {
            case String.fromCharCode(8211):
            case String.fromCharCode(8212):
            case '\'s':
            case '\'':
            case '- ':
            case '(':
            case ':':
            case '-':
              player = parts[0];
              name = parts[1];
              break;
            case ' by ':
              player = parts[1];
              name = parts[0];
              break;
          }

          return true;
        });

        let result = parse ?
          {player, name, link, raw} :
          {player: meta, link, raw};

        // Handle the case of Aye, Gareth
        if (result.player.length && result.player.includes(',')) {
          let [last, first] = result.player.split(',').map(x => x.trim());
          result.player = `${first} ${last}`;
        }

        if (result.name && result.name.length && result.name.includes(',')) {
          result.name = result.name.replace(',', '');
        }

        [
          'GP',
          'Grand Prix'
        ].forEach(str => {
          if (result.name && result.name.includes(str)) {
            result.name = result.name.split(str)[0].trim();
          }
        });

        [
          /^\-/,
          /\s*[\-–—\(]\s*$/,
          /[\-–—]\s+.*$/,
          /[\-–—]\s*$/,
          /(A|a)t\s*$/
        ].forEach(re => {
          if (result.name) {
            result.name = result.name.replace(re, '');
          }
        });

        return result;
      });
      } catch (error) {
        debug(error);
        return [];
      }
    })
  );

  return flatten(decks.map(trimBoilerplate2));
}

function trimBoilerplate(decks) {
  let ixes = getCommonPrefixAndSuffix(decks);
  return decks.map(deck => {
    return deck
      .replace(ixes.prefix, '')
      .replace(ixes.suffix, '');
  });
}

function trimBoilerplate2(decks) {
  let ixes = {};
  ['player', 'name'].forEach(field => {
    ixes[field] = getCommonPrefixAndSuffix(
      decks.map(deck => deck[field])
    )
  });

  ['prefix', 'suffix'].forEach(ixtype => {
    ['player', 'name'].forEach(field => {
      let ix = ixes[field][ixtype];
      if (ix.length >= 3) {
        decks.forEach(deck => {
          deck[field] = deck[field].replace(ix, '');
        });
      }
    });
  });

  return decks;
}

module.exports = GetDecklists;
