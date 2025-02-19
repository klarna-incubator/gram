import { readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import path from "path";

const assetDir = path.join(import.meta.url.replace("file:", ""), '../../assets');

export function getAllSvgFiles(dir: string) {
    let results: string[] = [];
    const list = readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(getAllSvgFiles(file));
        } else if (file.endsWith('.svg')) {
            results.push(path.relative(assetDir, file));
        }
    });
    return results;
}

export function checkSvgFileForWidthHeight(svgFile: string) {
    const svgContent = readFileSync(path.join(assetDir, svgFile), 'utf-8');

    const tag = svgContent.match(/<svg([^>]*)>/);

    if (!tag) throw new Error(`No <svg> tag found in ${svgFile}`);

    const tagAttributes = tag[1];
    // console.log(tagAttributes);

    const width = tagAttributes?.match(/width="([\d\\.pxm]+)"/);
    const height = tagAttributes?.match(/height="([\d\\.pxm]+)"/);

    return !!width && !!height;
}