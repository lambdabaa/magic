let GetDecklists = require('../../src/crawler/GetDecklists');
let assert = require('assert');
let flatten = require('lodash/array/flatten');

suite('GetDecklists', () => {
  test('SCG', done => {
    let result = [];
    let scg = new GetDecklists();
    scg.on('data', event => result.push(event.decklists));
    scg.on('end', () => {
      let decks = flatten(result);
      assert.ok(decks.length > 50);
      decks.forEach(deck => {
        assert.ok(typeof deck.player === 'string');
        assert.ok(typeof deck.link === 'string');
      });

      done();
    });

    scg.write({
      reporter: 'SCG',
      date: 1451721600000,
      format: 'Legacy',
      link: 'http://starcitygames.com/events/130113_sandiego.html',
      location: 'San Diego, CA'
    });

    scg.write({
      reporter: 'SCG',
      date: 1446883200000,
      format: 'Standard',
      link: 'http://www.starcitygames.com/events/071115_philadelphia.html',
      location: 'Philadelphia'
    });

    scg.end();
  });

  test('WotC', done => {
    let result = [];
    let wotc = new GetDecklists();
    wotc.on('data', event => result.push(event.decklists));
    wotc.on('end', () => {
      let decks = flatten(result);
      assert.ok(decks.length > 100);
      decks.forEach(deck => {
        assert.ok(typeof deck.player === 'string');
        assert.ok(typeof deck.link === 'string');
      });

      done();
    });

    wotc.write({
      reporter: 'WotC',
      date: 1465628400000,
      format: 'Legacy',
      link: 'http://magic.wizards.com/en/events/coverage/gpcol16',
      location: 'Columbus'
    });

    wotc.write({
      reporter: 'WotC',
      date: 1444978800000,
      format: 'Standard',
      link: 'http://magic.wizards.com/en/events/coverage/ptbfz',
      location: 'Battle for Zendikar in Milwaukee'
    });

    wotc.end();
  });
});
