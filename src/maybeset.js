let debug = console.log.bind(console, '[crawler/maybeset]');

async function maybeset(ref, value) {
  let snapshot = await ref.once('value');
  if (snapshot.exists()) {
    return;
  }

  debug(ref.toString());
  await ref.set(value);
}

module.exports = maybeset;
