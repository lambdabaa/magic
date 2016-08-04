let defer = require('./defer');

function waitForEvent(emitter, eventType) {
  let deferred = defer();
  emitter.on(eventType, deferred.resolve);
  return deferred.promise;
}

module.exports = waitForEvent;
