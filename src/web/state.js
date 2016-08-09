let assign = Object.assign.bind(Object);
let {createStore} = require('redux');
let debug = console.log.bind(console, '[state]');
let merge = require('lodash/object/merge');
let {routerReducer} = require('react-router-redux');

const initialState = {
  format: 'Standard',

  decks: {
    Legacy: {},
    Modern: {},
    Standard: {}
  }
};

let store = createStore((state = initialState, action) => {
  let result;
  if (action.type !== 'SET_STATE') {
    result = state;
  } else {
    let strategy = action.overwrite ? assign : merge;
    result = strategy({}, state, action.value);
  }

  let next = assign(
    result,
    {routing: routerReducer(state && state.routing, action)}
  );

  debug(JSON.stringify(next));
  return next;
});

function update(value, overwrite = false) {
  return store.dispatch({type: 'SET_STATE', value, overwrite});
}


exports.store = store;
exports.update = update;
