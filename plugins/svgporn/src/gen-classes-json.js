/**
 * Script to automatically generate SVGPORN Component Classes from the repo contents (logos.json + logos folder)
 */

import { randomUUID } from "crypto";
import { readFileSync, writeFileSync } from "fs";

const currentClasses = JSON.parse(readFileSync("classes.json"));

const exists = new Map();
currentClasses.forEach((c) => exists.set(c.name.trim(), c));

const logos = JSON.parse(readFileSync("logos.json"));
let n = 0;
let o = 0;
const newClasses = logos
  .map((l) => {
    const name = l.name.trim();

    if (exists.has(name)) {
      o += 1;
      return exists.get(name);
    }
    n += 1;
    const newClass = {
      id: randomUUID(),
      name,
      componentType: "any",
      icon: `/assets/svgporn/${l.files[0]}`,
    };
    exists.set(name, newClass);
    console.log("+", name);
    return newClass;
  })
  // Filter AWS logos, handled in a different pack
  .filter((c) => !c.name.startsWith("AWS "));

console.log("==================================");
console.log(`${n} new classes / ${o} old classes`);

writeFileSync("new-classes.json", JSON.stringify(newClasses, null, 2));
