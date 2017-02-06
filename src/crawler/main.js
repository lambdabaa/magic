let Combine = require('./Combine');
let DeckMerger = require('./DeckMerger');
let Filter = require('./Filter');
let GetDecklists = require('./GetDecklists');
let GetMatchResults = require('./GetMatchResults');
let ListScgEvents = require('./ListScgEvents');
let ListWizardsEvents = require('./ListWizardsEvents');
let SaveEventToFirebase = require('./SaveEventToFirebase');
let debug = console.log.bind(console, '[crawler/main]');
let waitForEvent = require('../waitForEvent');

async function main() {
  let ref = new Firebase('https://mtgstats.firebaseio.com');
  //await ref.authWithCustomToken('tTxh4X9b1gGIySp4XvSFvuTcf50Pt0XnSxoCYN49');

  let source = new Combine(new ListScgEvents(), new ListWizardsEvents());
  let sink = new GetMatchResults();
  sink.on('data', results => {
    console.log(JSON.stringify(results));
  });

  source
    .pipe(new SaveEventToFirebase())
    .pipe(new GetDecklists())
    .pipe(new DeckMerger())
    //.pipe(new Filter(event => event.reporter === 'WotC'))
    .pipe(sink);
  await waitForEvent(sink, 'end');
  process.exit(0);
}

module.exports = main;
