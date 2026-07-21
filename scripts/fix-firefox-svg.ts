import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { checkSvgFileForWidthHeight, getAllSvgFiles } from "@gram/core/dist/util/svg.js";



function fixSvgFile(svgFile: string) {
    const svgContent = readFileSync(svgFile, 'utf-8');

    const tag = svgContent.match(/<svg([^>]*)>/);

    if (!tag) throw new Error(`No <svg> tag found in ${svgFile}`);

    const tagAttributes = tag[1];
    // console.log(tagAttributes);

    const viewBox = tagAttributes?.match(/viewBox="[\\-\d\\.]+ [\\-\d\\.]+ ([\\-\d\\.]+) ([\\-\d\\.]+)"/);

    if (!viewBox) throw new Error(`No viewBox attribute found in ${svgFile}`);

    const width = viewBox[1];
    const height = viewBox[2];

    const newSvgContent = svgContent.replace(/<svg([^>]*)>/, `<svg$1 width="${width}px" height="${height}px">`);
    // console.log(newSvgContent);

    writeFileSync(svgFile, newSvgContent);
}


const assetDir = path.join(import.meta.url.replace("file:", ""), '../../plugins/');
const svg = getAllSvgFiles(assetDir).filter(svgFile => !checkSvgFileForWidthHeight(svgFile));

let failed = 0;
let passed = 0;

console.log("Faulty SVGs found:");
for (const svgFile of svg) {
    console.log(svgFile);
    try {
        fixSvgFile(svgFile);
        passed++;
    } catch (e) {
        console.error(e);
        failed++;
    }
    console.log();
}

console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);