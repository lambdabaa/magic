let Combine = require('./Combine');
let DeckMerger = require('./DeckMerger');
let GetDecklists = require('./GetDecklists');
let GetMatchResults = require('./GetMatchResults');
let ListScgEvents = require('./ListScgEvents');
let ListWizardsEvents = require('./ListWizardsEvents');
let SaveEventToFirebase = require('./SaveEventToFirebase');
let debug = console.log.bind(console, '[crawler/main]');
let sleep = require('../sleep');
let waitForEvent = require('../waitForEvent');

async function main() {
  let source = new Combine(new ListScgEvents(), new ListWizardsEvents());
  let sink = new DeckMerger();
  source
    .pipe(new SaveEventToFirebase())
    .pipe(new GetDecklists())
    .pipe(sink);
  await waitForEvent(sink, 'end');
  debug('bad', sink._bad);
  process.exit(0);
}

module.exports = main;
