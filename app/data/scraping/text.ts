/**
 * Get the longest prefix common to a list of strings.
 * @param strings the strings to be compared
 */
export const longestCommonPrefix = (strings: string[]): string => {
  const sortedStrings = strings.sort((a, b) => (a < b ? -1 : 1));

  if (strings.length === 0) {
    return "";
  }

  let output = [];
  const firstString = sortedStrings[0];
  const lastString = sortedStrings.at(-1);
  for (let i = 0; i < firstString.length; i++) {
    if (firstString[i] === lastString?.at(i)) {
      output.push(firstString[i]);
    } else {
      break;
    }
  }

  return output.join("");
};

/**
 * Turn a list of strings into the same list, but stripped of their longest
 * common prefix (except the first string, which is returned as-is).
 * @param texts the strings to be stripped of a common prefix
 */
export const withoutRepeatedPrefix = (texts: string[]): string[] => {
  const prefix = longestCommonPrefix(texts);

  if (prefix === "") {
    return texts;
  }

  const firstText = texts[0];
  const rest = texts.slice(1);
  const shortenedTexts = rest.map((text) => text.substring(prefix.length));
  return [firstText, ...shortenedTexts];
};
