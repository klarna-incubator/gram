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
