import { Entry } from "ldapts";

export function getAttribute(ldapObj: Entry, name: string) {
  return ldapObj[name] ? ldapObj[name].toString() : "";
}

export function getAttributeAsArray(ldapObj: Entry, name: string) {
  const attr = ldapObj[name];
  if (typeof attr == "string") {
    return [attr];
  }
  if (attr instanceof Buffer) {
    return [attr.toString()];
  }
  return attr ? attr.map((a: Buffer | string) => a.toString()) : [];
}

// From https://github.com/ldapts/ldapts/blob/main/src/filters/Filter.ts#L32
export function escapeFilterValue(input: Buffer | string): string {
  let escapedResult = "";
  if (Buffer.isBuffer(input)) {
    for (const inputChar of input) {
      if (inputChar < 16) {
        escapedResult += `\\0${inputChar.toString(16)}`;
      } else {
        escapedResult += `\\${inputChar.toString(16)}`;
      }
    }
  } else {
    for (const inputChar of input) {
      switch (inputChar) {
        case "*":
          escapedResult += "\\2a";
          break;
        case "(":
          escapedResult += "\\28";
          break;
        case ")":
          escapedResult += "\\29";
          break;
        case "\\":
          escapedResult += "\\5c";
          break;
        case "\0":
          escapedResult += "\\00";
          break;
        default:
          escapedResult += inputChar;
          break;
      }
    }
  }

  return escapedResult;
}
