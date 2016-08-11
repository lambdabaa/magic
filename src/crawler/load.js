let jsdom = require('jsdom');

function load(url) {
  return new Promise((resolve, reject) => {
    jsdom.env(
      url,
      {
        features: {
          //FetchExternalResources: ['link']
          FetchExternalResources: []
        }
      },
      (error, window) => {
        return error ? reject(error) : resolve(window);
      }
    );
  });
}

module.exports = load;
