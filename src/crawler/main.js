let Firebase = require('firebase');
let ListScgEvents = require('./ListScgEvents');
let ListWizardsEvents = require('./ListWizardsEvents');
let debug = console.log.bind(console, '[crawler/main]');
let uuid = require('uuid');

let ref = new Firebase('https://mtgstats.firebaseio.com/events');

function main() {
  let scg = new ListScgEvents();
  let wizards = new ListWizardsEvents();

  scg.on('data', function(chunk) {
    /*
    try {
      let child = ref.child(uuid.v4());
      child.set(chunk);
    } catch (error) {
      debug(error.toString());
    }
    */
  });

  wizards.on('data', function(chunk) {
    /*
    try {
      let child = ref.child(uuid.v4());
      child.set(chunk);
    } catch (error) {
      debug(error.toString());
    }
    */
  });
}

module.exports = main;
