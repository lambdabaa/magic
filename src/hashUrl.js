let btoa = require('btoa');
let url = require('url');

function hashUrl(aUrl) {
  return btoa(url.parse(aUrl).path);
}

module.exports = hashUrl;
