import path from 'path';
import { checkSvgFileForWidthHeight, getAllSvgFiles } from '@gram/core/dist/util/svg.js';
// import { checkSvgFileForWidthHeight, getAllSvgFiles } from './svg-util.js';


describe("check SVGs for firefox compatibility - `npm run fix-firefox-svg` to fix", () => {
    const assetDir = path.join(import.meta.url.replace("file:", ""), '../');
    const svg = getAllSvgFiles(assetDir);

    test.each(svg)("%p should have a width and height attribute in its svg tag", async (svgFile) => {
        const hasWidthHeight = checkSvgFileForWidthHeight(svgFile);
        expect(hasWidthHeight).toBe(true);
    });
});