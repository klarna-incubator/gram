import helmet from "helmet";
import config from "config";

function getConfigAsArray(key: string): string[] {
  const values: string[] = [];
  if (!config.has(key)) {
    return values;
  }

  const c = config.get(key);
  if (typeof c === "string") {
    values.push(c);
  } else if (Array.isArray(c)) {
    values.push(...c);
  }

  return values;
}

export function securityHeaders() {
  const allowedImgs: string[] = getConfigAsArray("allowedSrc.img");
  const allowedConnects: string[] = getConfigAsArray("allowedSrc.connect");

  return helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "script-src": ["'self'"],
        // unsafe-inline is needed on style due to MUI using it... and adding a nonce/hash is complicated.
        "connect-src": ["self", ...allowedConnects],
        "style-src": ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
        "font-src": ["https://fonts.gstatic.com"],
        "img-src": ["'self'", ...allowedImgs],
      },
    },
    // allows loading resources from other domains, e.g. github avatar, without explicit CORS headers set on the other domains' end https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Embedder-Policy
    crossOriginEmbedderPolicy: false,
  });
}
