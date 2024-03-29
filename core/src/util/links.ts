import { config } from "../config/index.js";

function trimEndSlash(s: string) {
  return s.endsWith("/") ? s.substr(0, s.length - 1) : s;
}

export function linkToModel(modelId: string) {
  const origins: string | string[] = config.origin;
  if (!origins || (Array.isArray(origins) && origins.length === 0)) {
    throw new Error("Couldn't find cors origin for generating model link");
  }
  if (Array.isArray(origins)) {
    return `${trimEndSlash(origins[0])}/model/${modelId}`;
  } else {
    return `${trimEndSlash(origins)}/model/${modelId}`;
  }
}

export function linkTo(path: string) {
  const origins: string | string[] = config.origin;
  if (!origins || (Array.isArray(origins) && origins.length === 0)) {
    throw new Error("Couldn't find cors origin for generating model link");
  }
  const pathOhneSlash = path.startsWith("/") ? path.substring(1) : path;
  if (Array.isArray(origins)) {
    return `${trimEndSlash(origins[0])}/${pathOhneSlash}`;
  } else {
    return `${trimEndSlash(origins)}/${pathOhneSlash}`;
  }
}
