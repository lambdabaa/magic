let {IndexRoute, Router, Route, browserHistory} = require('react-router');
let {Provider} = require('react-redux');
let ReactDOM = require('react-dom');
let client = require('./client');
let {store} = require('./state');
let {syncHistoryWithStore} = require('react-router-redux');

async function main() {
  let history = syncHistoryWithStore(browserHistory, store);
  client.load();
  await new Promise(resolve => {
    google.charts.load('current', {'packages':['corechart']});
    google.charts.setOnLoadCallback(resolve);
  });

  ReactDOM.render(
    <Provider store={store}>
      <Router history={history}>
        <Route path="/" component={require('./components/App')}>
          <IndexRoute component={require('./components/Grid')} />
          <Route path="decks/*/*" component={require('./components/Deck')} />
        </Route>
      </Router>
    </Provider>,
    document.getElementById('container')
  );
}

window.onload = main;
