let Firebase = require('firebase');
let btoa = require('btoa');
let debug = console.log.bind(console, '[crawler/GetMatchResults]');
let flatten = require('lodash/array/flatten');
let getThroughCache = require('./getThroughCache');
let load = require('./load');
let maybeset = require('../maybeset');
let sleep = require('../sleep');
let stream = require('stream');
let waitFor = require('../waitFor');

let ref = new Firebase('https://mtgstats.firebaseio.com/results');

class GetMatchResults extends stream.Transform {
 constructor() {
    super({objectMode: true});
  }

  async _transform(event, encoding, callback) {
    debug(event.link, event.format);
    try {
      let replace = replacePlayers(event);
      let results = await scrapeEventResults(event);
      debug('scraped', results.length);
      results = results
        .map(replace)
        .filter(result => !!result && result.winner !== 0);
      debug('results', results.length);
      debug('results', JSON.stringify(results));

      await Promise.all(
        results.map(result => {
          return maybeset(
            ref.child(result.id),
            result
          );
        })
      );

      callback(null, results);
    } catch (error) {
      debug(event.link, error);
      return callback();
    }
  }
}

function isPlayerName(name) {
  try {
    let normalized = normalizePlayerName(name);
    return /[A-Za-z][A-Za-z\']+\s[A-Za-z][A-Za-z\']+/.test(normalized);
  } catch (error) {
    return false;
  }
}

function normalizePlayerName(name) {
  if (name.includes(',')) {
    let [pre, post] = name.split(',').map(x => x.trim());
    return normalizePlayerName(post + ' ' + pre);
  }

  let parts = name.split(/\s+/);
  if (parts.length === 2) {
    return parts[0].charAt(0).toUpperCase() +
           parts[0].slice(1).toLowerCase() +
           ' ' +
           parts[1].charAt(0).toUpperCase() +
           parts[1].slice(1).toLowerCase();
  }

  if (parts.length > 2) {
    return normalizePlayerName(parts[0] + ' ' + parts[parts.length - 1]);
  }

  return name;
}

function replacePlayers(event) {
  let playerToDeck = {};
  event.decklists.forEach(deck => {
    let name = normalizePlayerName(deck.player);
    playerToDeck[name] = deck.normalized;
  });

  return function(result) {
    let [player1, player2] = result.players.map(normalizePlayerName);
    if (!playerToDeck[player1] || !playerToDeck[player2]) {
      return null;
    }

    return {
      p1: playerToDeck[player1],
      p2: playerToDeck[player2],
      date: event.date,
      format: event.format,
      id: btoa([event.date, result.rount, player1, player2].join(',')),
      winner: result.winner + 1
    };
  };
}

function scrapeEventResults(event) {
  switch (event.reporter) {
    case 'SCG':
      return scrapeScgResults(event);
    case 'WotC':
      return scrapeWizardsResults(event);
  }
}

async function scrapeScgResults(event) {
  let html = await getThroughCache(event.link);
  let window = await load(html);
  let doc = window.document;
  let results = await Promise.all(
    Array
      .from(doc.getElementById('tabs').children)
      .filter(tab => {
        return [
          event.format,
          'Saturday',
          'Sunday',
          'Day'
        ].some(x => tab.id.includes(x));
      })
      .map(scrapeScgTabResults)
  );

  return flatten(results);
}

async function scrapeScgTabResults(tab) {
  let swiss = await scrapeScgTabSwissResults(tab);
  let top8 = scrapeScgTabTop8Results(tab);
  return swiss.concat(top8);
}

async function scrapeScgTabSwissResults(tab) {
  let links = flatten(
    Array.from(
      tab
        .getElementsByClassName('standings_table')[0]
        .getElementsByTagName('tr')
    )
    .filter(row => {
      let child = row.children[1];
      return child &&
             child.tagName.toUpperCase() === 'TD' &&
             child.children.length;
    })
    .map(row => {
      let {href, textContent} = row.children[1].children[0];
      href = href.startsWith('http') ?
        href :
        'http://starcitygames.com' + href;
      return {href, textContent};
    })
  );

  let results = await Promise.all(links.map(async (link) => {
    let html = await getThroughCache(link.href);
    let window = await load(html);
    let doc = window.document;
    return Array
      .from(doc.getElementsByTagName('tr'))
      .filter(row => row.children[0].tagName === 'TD')
      .map(row => {
        return Array
          .from(row.children)
          .filter(element => {
            return [
              ',',
              'WON',
              'DREW',
              'DRAW',
              'LOST'
            ].some(result => {
              return element.textContent.toUpperCase().includes(result);
            });
          })
          .map(element => element.textContent);
      })
      .filter(entry => {
        return entry.length === 3 && entry.every(str => !!str.length);
      })
      .map(entry => {
        let winner;
        let text = entry[1].toUpperCase();
        if (text.includes('WON')) {
          winner = 0;
        } else if (text.includes('DRAW') || text.includes('DREW')) {
          winner = -1;
        } else if (text.includes('LOST')) {
          winner = 1;
        }

        return {
          round: +link.textContent,
          players: [
            normalizePlayerName(entry[0]),
            normalizePlayerName(entry[2])
          ],
          winner
        };
      });
  }));

  return flatten(results);
}

function scrapeScgTabTop8Results(tab) {
  let bracket = tab.getElementsByClassName('top8-bracket')[0];
  if (!bracket) {
    return [];
  }

  let qf = Array
    .from(bracket.querySelectorAll('.top8-column-qf .top8-column-row'))
    .map(row => row.textContent.replace(/\d\s?-\s?\d/, '').trim())
    .filter(isPlayerName)
    .map(normalizePlayerName);
  let sf = Array
    .from(bracket.querySelectorAll('.top8-column-sf .top8-column-row'))
    .map(row => row.textContent.replace(/\d\s?-\s?\d/, '').trim())
    .filter(isPlayerName)
    .map(normalizePlayerName);
  let f = Array
    .from(bracket.querySelectorAll('.top8-column-f .top8-column-row'))
    .map(row => row.textContent.replace(/\d\s?-\s?\d/, '').trim())
    .filter(isPlayerName)
    .map(normalizePlayerName);
  let c = Array
    .from(bracket.querySelectorAll('.top8-column-c .top8-column-row'))
    .map(row => row.textContent.replace(/\d\s?-\s?\d/, '').trim())
    .filter(isPlayerName)
    .map(normalizePlayerName);

  let results = [];
  for (let i = 0; i < qf.length; i += 2) {
    let players = [qf[i], qf[i + 1]];
    let winner = players.indexOf(sf[i / 2]);
    results.push({
      players,
      winner,
      round: 'elimination'
    });
  }

  for (let i = 0; i < sf.length; i += 2) {
    let players = [sf[i], sf[i + 1]];
    let winner = players.indexOf(f[i / 2]);
    results.push({
      players,
      winner,
      round: 'elimination'
    });
  }

  for (let i = 0; i < f.length; i += 2) {
    let players = [f[i], f[i + 1]];
    let winner = players.indexOf(c[i / 2]);
    results.push({
      players,
      winner,
      round: 'elimination'
    });
  }

  return results;
}

async function scrapeWizardsResults(event) {
  let html = await getThroughCache(event.link);
  let window = await load(html);
  let doc = window.document;
  let swiss = await scrapeWizardsSwissResults(event, doc);
  let top8 = scrapeWizardsTop8Results(event, doc);
  return swiss.concat(top8);
}

async function scrapeWizardsSwissResults(event, doc) {
  let container = Array
    .from(doc.querySelectorAll('#standings .by-day'))
    .find(child => child.textContent.includes('RESULTS'));
  let links = Array.from(container.getElementsByTagName('a'));
  let results = await Promise.all(links.map(async (link) => {
    let href = link.href.startsWith('http') ?
      link.href :
      'http://magic.wizards.com' + link.href;
    let html = await getThroughCache(href);
    let window = await load(html);
    let page = window.document;

    await waitFor(() => !!getLastTableRows(page).length);

    let buttons = Array.from(page.getElementsByClassName('paginate-button'));
    if (!buttons.length) {
      return parseWizardsSwissResults(getLastTableRows(page));
    }

    let entries = [];
    for (let i = 0; i < buttons.length; i++) {
      let button = buttons[i];
      button.click();
      await waitFor(() => button.classList.contains('current'));
      await sleep(250);
      entries = entries.concat(
        parseWizardsSwissResults(getLastTableRows(page))
      );
    }

    return entries;
  }));

  return flatten(results);
}

function parseWizardsSwissResults(rows) {
  return rows
    .filter(row => {
      let child = row.children[0];
      return child && child.tagName === 'TD';
    })
    .map(row => {
      return Array
        .from(row.children)
        .filter(element => {
          return [
            ',',
            'WON',
            'DREW',
            'DRAW',
            'LOST'
          ].some(result => {
            return element.textContent.toUpperCase().includes(result);
          });
        })
        .map(element => element.textContent);
    })
    .filter(entry => {
      return entry.length === 3 && entry.every(str => !!str.length);
    })
    .map(entry => {
      let winner;
      let text = entry[1].toUpperCase();
      if (text.includes('WON')) {
        winner = 0;
      } else if (text.includes('DRAW') || text.includes('DREW')) {
        winner = -1;
      } else if (text.includes('LOST')) {
        winner = 1;
      }

      return {
        players: [
          normalizePlayerName(entry[0]),
          normalizePlayerName(entry[2])
        ],
        winner
      };
    });
}

function getLastTableRows(parent) {
  let tables = parent.getElementsByTagName('table');
  let table = tables[tables.length - 1];
  return Array.from(table.getElementsByTagName('tr'));
}

function scrapeWizardsTop8Results(event, doc) {
  let container = doc.getElementsByClassName('top-bracket-slider')[0];
  let qf = Array
    .from(container.querySelectorAll('.quarterfinals .dual-players'))
    .map(parseWizardsDualPlayers);

  let sf = Array
    .from(container.querySelectorAll('.semifinals .dual-players'))
    .map(parseWizardsDualPlayers);

  let f = Array
    .from(container.querySelectorAll('.finals .dual-players'))
    .map(parseWizardsDualPlayers);

  return qf.concat(sf).concat(f);
}

function parseWizardsDualPlayers(element) {
  let players = Array.from(element.getElementsByClassName('player'));
  let index = -1;
  players.some((player, idx) => {
    let strongs = player.getElementsByTagName('strong');
    if (strongs.length) {
      index = idx;
      return true;
    }

    return false;
  });

  return {
    players: players.map(player => {
      return player
        .textContent
        .replace('(', '')
        .replace(')', '')
        .replace(/\d\-\d/, '')
        .replace(/\d/g, '')
        .trim();
    }),
    winner: index
  };
}

module.exports = GetMatchResults;
