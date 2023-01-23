/**
 * Script to automatically generate Kubernetes resource Classes based on filenames.
 * Run this once to generate a json file then adjust as needed.
 */

const fs = require("fs");
const { join } = require("path");
const { v4 } = require("uuid");

const assetDir = join(__dirname, "assets");
const files = fs.readdirSync(assetDir).filter((f) => f.endsWith(".svg"));

const items = [];

files.forEach((file) => {
  items.push({
    id: v4(),
    name: (!file.startsWith("Kubernetes") ? `Kubernetes ${file}` : file)
      .replace(".svg", "")
      .replace(/-/g, " "),
    componentType: "any",
    icon: `/assets/kubernetes/${file}`,
  });
});

fs.writeFileSync(
  join(__dirname, "classes.json"),
  JSON.stringify(items, null, 4)
);
