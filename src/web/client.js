let Firebase = require('firebase/lib/firebase-web');
let {store, update} = require('./state');

let firebaseSecretToken = 'tTxh4X9b1gGIySp4XvSFvuTcf50Pt0XnSxoCYN49';
let ref = new Firebase('https://mtgstats.firebaseio.com');
let auth = ref.authWithCustomToken(firebaseSecretToken);

async function load() {
  await auth;
  await Promise.all(
    ['Legacy', 'Modern', 'Standard'].map(async (format) => {
      let snapshot = await ref
        .child('groups')
        .child(format)
        .once('value');
      update({
        decks: {[format]: snapshot.val()}
      });
    })
  );
}

async function syncResults(format, deck) {
  await auth;
  let ref1 = ref
    .child('results')
    .orderByChild('p1')
    .equalTo(deck)
    .once('value');
  let ref2 = ref
    .child('results')
    .orderByChild('p2')
    .equalTo(deck)
    .once('value');
  let [p1, p2] = await Promise.all([ref1, ref2]);
  let diff = {};
  [p1, p2].forEach(p => {
    let res = p.val();
    for (let key in res) {
      let match = res[key];
      if (match.format === format) {
        diff[key] = match;
      }
    }
  });

  update({results: {[format]: diff}});
}

exports.load = load;
exports.syncResults = syncResults;
