import { Entry } from "ldapts";

export function getAttribute(ldapObj: Entry, name: string): string {
  return ldapObj[name] ? String(ldapObj[name]) : "";
}

export function getAttributeAsArray(ldapObj: Entry, name: string): string[] {
  const attr = ldapObj[name];
  if (!attr) return [];

  // `ldapts` Entry attribute types are a broad union (string, Buffer, number, Uint8Array, arrays of those).
  // Normalize here so callers can treat attributes consistently as `string[]`.
  if (Array.isArray(attr)) {
    return attr.map((a) => String(a));
  }

  return [String(attr)];
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
