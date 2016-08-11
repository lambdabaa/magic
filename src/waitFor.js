let sleep = require('./sleep');

function waitFor(test) {
  let result;
  try {
    result = test();
  } catch (error) {
    return Promise.reject(error);
  }

  if (typeof result !== 'object') {
    return handleResult(test, result);
  }

  if (result.then) {
    return result.then(value => {
      return handleResult(test, value);
    });
  }

  throw new Error(`Unrecognizable test result: ${result}`);
}

function handleResult(test, result) {
  if (result) {
    return Promise.resolve();
  }

  return sleep(500).then(() => {
    return waitFor(test);
  });
}

module.exports = waitFor;
