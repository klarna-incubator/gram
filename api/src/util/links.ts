import config from "config";

function trimEndSlash(s: string) {
  return s.endsWith("/") ? s.substr(0, s.length - 1) : s;
}

export function linkToModel(modelId: string) {
  const origins: string | string[] = config.get("origin");
  if (!origins || (Array.isArray(origins) && origins.length === 0)) {
    throw new Error("Couldn't find cors origin for generating model link");
  }
  if (Array.isArray(origins)) {
    return `${trimEndSlash(origins[0])}/model/${modelId}`;
  } else {
    return `${trimEndSlash(origins)}/model/${modelId}`;
  }
}
