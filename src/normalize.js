function normalize(str) {
  let parts = str
    .trim()
    .split(/[\s+\-\/]/)
    .filter(word => typeof word === 'string' && !!word.length)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
  let result = [];
  for (let i = 0; i < parts.length; i += 3) {
    let a = parts[i];
    let b = parts[i + 1];
    let c = parts[i + 2];

    if (typeof a !== 'string') {
      break;
    }

    if (typeof b !== 'string') {
      result.push(a);
      break;
    }

    if (typeof c !== 'string') {
      if (a.length === 1 && b.length === 1) {
        result.push(a + b);
        continue;
      }

      result.push(a);
      result.push(b);
      continue;
    }

    if (a.length === 1 && b.length === 1) {
      if (c.length === 1) {
        result.push(a + b + c);
      } else {
        result.push(a + b);
        result.push(c);
      }

      continue;
    }

    result.push(a);
    result.push(b);
    result.push(c);
  }

  return result.join(' ');
}

module.exports = normalize;
