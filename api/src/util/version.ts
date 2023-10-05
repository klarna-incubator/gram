import fs from "fs";

const json = JSON.parse(fs.readFileSync("package.json", "utf8"));
export const version: string = json.version;
