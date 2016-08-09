let assert = require('assert');
let debug = console.log.bind(console, '[crawler/getThroughCache]');
let fetch = require('node-fetch');
let fs = require('mz/fs');
let hashUrl = require('../hashUrl');

const cachedir = __dirname + '/../../cache';

async function getThroughCache(aUrl, force = false) {
  let hash = hashUrl(aUrl);
  let path = cachedir + '/' + hash;
  let exists = await fs.exists(path);
  if (exists && !force) {
    //debug('Cache hit', aUrl);
    return await fs.readFile(path, {encoding: 'utf8'});
  }

  //debug('Cache miss', aUrl);
  let res = await fetch(aUrl);
  assert.ok(res.status >= 200 && res.status < 400);
  let data = await res.text();
  await fs.writeFile(path, data);
  return data;
}

module.exports = getThroughCache;
