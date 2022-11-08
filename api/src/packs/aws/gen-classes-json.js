/**
 * Script to automatically generate AWS Component Classes based on filenames found in the
 * AWS Architecture Icons. Run this once to generate a json file then adjust as needed.
 */

const fs = require("fs");
const { join } = require("path");
const { v4 } = require("uuid");

const assetDir = join(__dirname, "assets");
const folders = fs.readdirSync(assetDir).filter((f) => f.includes("Arch"));

const items = [];

// Traverse down
folders.forEach((topf) => {
  const archFolder = join(assetDir, topf);
  const s = fs.readdirSync(archFolder).find((f2) => f2.includes("16"));
  if (!s) return;
  const sixteen = join(archFolder, s);
  const services = fs.readdirSync(sixteen).filter((f) => f.endsWith(".svg"));
  services.forEach((serv) => {
    items.push({
      id: v4(),
      name: serv
        .substr("Arch_".length)
        .replace("_16.svg", "")
        .replace(/-/g, " "),
      componentType: "any",
      icon: `/assets/aws/${topf}/${s}/${serv}`,
    });
  });
});

fs.writeFileSync("classes.json", JSON.stringify(items, null, 4));
