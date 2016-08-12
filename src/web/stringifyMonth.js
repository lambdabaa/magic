function stringifyMonth(idx) {
  let year = Math.floor(idx / 12);
  let month = idx % 12;
  return `${month + 1}/${year % 100}`;
}

module.exports = stringifyMonth;
