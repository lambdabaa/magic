let ListScgEvents = require('./ListScgEvents');
let ListWizardsEvents = require('./ListWizardsEvents');
let PersistEvent = require('./PersistEvent');
let debug = console.log.bind(console, '[crawler/main]');
let waitForEvent = require('../waitForEvent');

async function main() {
  let persist = new PersistEvent();
  let scg = new ListScgEvents();
  let wizards = new ListWizardsEvents();
  scg.pipe(persist, {end: false});
  wizards.pipe(persist, {end: false});

  await Promise.all([
    waitForEvent(scg, 'end'),
    waitForEvent(wizards, 'end')
  ]);

  debug('Read events from scg and wotc');

  persist.end(() => {
    debug('Wrote events to firebase');
    process.exit(0);
  });
}

module.exports = main;
