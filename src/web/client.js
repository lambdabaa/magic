let Firebase = require('firebase/lib/firebase-web');
let {update} = require('./state');

let firebaseSecretToken = 'tTxh4X9b1gGIySp4XvSFvuTcf50Pt0XnSxoCYN49';
let ref = new Firebase('https://mtgstats.firebaseio.com/groups');

async function load() {
  await ref.authWithCustomToken(firebaseSecretToken);
  await Promise.all(
    ['Legacy', 'Modern', 'Standard'].map(async (format) => {
      let snapshot = await ref
        .child(format)
        .orderByChild('count')
        .once('value');
      update({
        decks: {[format]: snapshot.val()}
      });
    })
  );
}

exports.load = load;
