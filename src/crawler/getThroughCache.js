let btoa = require('btoa');
let debug = console.log.bind(console, '[crawler/getThroughCache]');
let fetch = require('node-fetch');
let fs = require('mz/fs');

const cachedir = __dirname + '/../../cache';

async function getThroughCache(url) {
  let hash = btoa(url);
  let path = cachedir + '/' + hash;
  let exists = await fs.exists(path);
  if (exists) {
    debug('Cache hit', url);
    return await fs.readFile(path, {encoding: 'utf8'});
  }

  debug('Cache miss', url);
  let res = await fetch(url);
  let data = await res.text();
  await fs.writeFile(path, data);
  return data;
}

module.exports = getThroughCache;
