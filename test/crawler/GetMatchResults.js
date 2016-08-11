let DeckMerger = require('../../src/crawler/DeckMerger');
let GetMatchResults = require('../../src/crawler/GetMatchResults');
let assert = require('assert');

let event1 = {"reporter":"SCG","date":1451721600000,"format":"Legacy","link":"http://starcitygames.com/events/130113_sandiego.html","location":"San Diego, CA","decklists":[{"link":"http://starcitygames.com/events/130113_sandiego.html","name":"TwelvePost","player":"Tony Murata","date":1451721600000,"format":"Legacy","location":"San Diego, CA"},{"link":"http://starcitygames.com/events/130113_sandiego.html","name":"RUG Delver","player":"Kurt Samson","date":1451721600000,"format":"Legacy","location":"San Diego, CA"},{"link":"http://starcitygames.com/events/130113_sandiego.html","name":"Jund","player":"Miki Urban","date":1451721600000,"format":"Legacy","location":"San Diego, CA"},{"link":"http://starcitygames.com/events/130113_sandiego.html","name":"Esper Stoneblade","player":"Jonathan Salem","date":1451721600000,"format":"Legacy","location":"San Diego, CA"},{"link":"http://starcitygames.com/events/130113_sandiego.html","name":"Reanimator","player":"Ross Roemer","date":1451721600000,"format":"Legacy","location":"San Diego, CA"},{"link":"http://starcitygames.com/events/130113_sandiego.html","name":"RUG Delver","player":"Andrew Castro","date":1451721600000,"format":"Legacy","location":"San Diego, CA"},{"link":"http://starcitygames.com/events/130113_sandiego.html","name":"U/W Control","player":"Robert Wilkinson","date":1451721600000,"format":"Legacy","location":"San Diego, CA"},{"link":"http://starcitygames.com/events/130113_sandiego.html","name":"Dredge","player":"Jason Bulkowski","date":1451721600000,"format":"Legacy","location":"San Diego, CA"},{"link":"http://starcitygames.com/events/130113_sandiego.html","name":"The Epic Storm","player":"Weston Brown","date":1451721600000,"format":"Legacy","location":"San Diego, CA"},{"link":"http://starcitygames.com/events/130113_sandiego.html","name":"RUG Delver","player":"Keyan Jafari","date":1451721600000,"format":"Legacy","location":"San Diego, CA"},{"link":"http://starcitygames.com/events/130113_sandiego.html","name":"RUG Delver","player":"Marc Lalague","date":1451721600000,"format":"Legacy","location":"San Diego, CA"},{"link":"http://starcitygames.com/events/130113_sandiego.html","name":"Elves","player":"John Harduvel","date":1451721600000,"format":"Legacy","location":"San Diego, CA"},{"link":"http://starcitygames.com/events/130113_sandiego.html","name":"RUG Delver","player":"Jonathan Job","date":1451721600000,"format":"Legacy","location":"San Diego, CA"},{"link":"http://starcitygames.com/events/130113_sandiego.html","name":"Sneak and Show","player":"Brian Page","date":1451721600000,"format":"Legacy","location":"San Diego, CA"},{"link":"http://starcitygames.com/events/130113_sandiego.html","name":"Goblins","player":"Justin Nguyen","date":1451721600000,"format":"Legacy","location":"San Diego, CA"},{"link":"http://starcitygames.com/events/130113_sandiego.html","name":"Jund","player":"Chang Han","date":1451721600000,"format":"Legacy","location":"San Diego, CA"},{"link":"http://starcitygames.com/events/130113_sandiego.html","name":"Metalworker","player":"Kelvin Young","date":1451721600000,"format":"Legacy","location":"San Diego, CA"},{"link":"http://starcitygames.com/events/130113_sandiego.html","name":"Sneak and Show","player":"Jacob Kory","date":1451721600000,"format":"Legacy","location":"San Diego, CA"},{"link":"http://starcitygames.com/events/130113_sandiego.html","name":"Jund Midrange","player":"Rakk Mera","date":1451721600000,"format":"Legacy","location":"San Diego, CA"},{"link":"http://starcitygames.com/events/130113_sandiego.html","name":"Esper Midrange","player":"Leon Kornacki","date":1451721600000,"format":"Legacy","location":"San Diego, CA"},{"link":"http://starcitygames.com/events/130113_sandiego.html","name":"U/W Miracles","player":"Joe Lossett","date":1451721600000,"format":"Legacy","location":"San Diego, CA"},{"link":"http://starcitygames.com/events/130113_sandiego.html","name":"Mono-White Stax","player":"Kevin Long","date":1451721600000,"format":"Legacy","location":"San Diego, CA"}]};

suite('GetMatchResults', () => {
  test('SCG', done => {
    let source = new DeckMerger();
    let sink = new GetMatchResults();
    source.pipe(sink);

    sink.on('data', chunk => {
      assert.equal(chunk.length, 27);
      chunk.forEach(checkMatchResults);
      done();
    });

    source.write(event1);
  });
});

function checkMatchResults(results) {
  assert.ok(results.winner === 1 || results.winner === 2);
  assert.equal(typeof results.p1, 'string');
  assert.equal(typeof results.p2, 'string');
  assert.equal(typeof results.date, 'number');
  assert.equal(typeof results.id, 'string');
  assert.ok(['Standard', 'Modern', 'Legacy'].includes(results.format));
}
