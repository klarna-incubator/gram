/**
 * Script to automatically generate CNCF Component Classes based on filenames.
 * Run this once to generate a json file then adjust as needed.
 */

const fs = require("fs");
const { join } = require("path");
const { v4 } = require("uuid");

const assetDir = join(__dirname, "assets");
const files = fs.readdirSync(assetDir).filter((f) => f.endsWith(".svg"));

const items = [];

const exceptions = ["CRI-O.svg", "Cert-Manager.svg"];

files.forEach((file) => {
  items.push({
    id: v4(),
    name: (exceptions.includes(file) ? file : file.replace(/-/g, " ")).replace(
      ".svg",
      ""
    ),
    componentType: "any",
    icon: `/assets/cncf/${file}`,
  });
});

fs.writeFileSync(
  join(__dirname, "classes.json"),
  JSON.stringify(items, null, 4)
);
