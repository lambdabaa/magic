function getCommonPrefixAndSuffix(list) {
  return {
    prefix: getCommonPrefix(list),
    suffix: getCommonSuffix(list)
  };
}

function getCommonPrefix(list, result = '') {
  if (!list.length) {
    return result;
  }

  if (list.some(element => {
    return typeof element !== 'string' || !element.length;
  })) {
    return result;
  }

  let chrs = list.map(element => element[0]);
  for (let i = 1; i < chrs.length; i++) {
    if (chrs[i] !== chrs[i - 1]) {
      return result;
    }
  }

  return getCommonPrefix(
    list.map(element => element.slice(1)),
    result + chrs[0]
  );
}

function getCommonSuffix(list) {
  return reverseString(
    getCommonPrefix(
      list.map(str => reverseString(str))
    )
  );
}

function reverseString(input, output = '') {
  if (!input || !input.length) {
    return output;
  }

  return reverseString(
    input.slice(0, input.length - 1),
    output + input.charAt(input.length - 1)
  );
}

module.exports = getCommonPrefixAndSuffix;
