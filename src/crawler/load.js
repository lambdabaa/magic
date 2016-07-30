let jsdom = require('jsdom');

function load(url) {
  return new Promise((resolve, reject) => {
    jsdom.env(url, (error, window) => {
      return error ? reject(error) : resolve(window);
    });
  });
}

module.exports = load;
