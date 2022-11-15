import helmet from "helmet";
import config from "config";

export function securityHeaders() {
  const allowedImgs: string[] = [];
  const c = config.get("allowedSrc.img");
  if (typeof c === "string") {
    allowedImgs.push(c);
  } else if (Array.isArray(c)) {
    allowedImgs.push(...c);
  }

  return helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "script-src": ["'self'"],
        // unsafe-inline is needed on style due to MUI using it... and adding a nonce/hash is complicated.
        "style-src": ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
        "font-src": ["https://fonts.gstatic.com"],
        "img-src": ["'self'", ...allowedImgs],
      },
    },
    // allows loading resources from other domains, e.g. github avatar, without explicit CORS headers set on the other domains' end https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Embedder-Policy
    crossOriginEmbedderPolicy: false,
  });
}
