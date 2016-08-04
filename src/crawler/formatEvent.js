function formatEvent(event) {
  return `${event.reporter} ${event.location} ${new Date(event.date).getFullYear()}`;
}

module.exports = formatEvent;
