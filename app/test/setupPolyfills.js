// jsdom doesn't expose TextEncoder/TextDecoder, which react-router 7 needs at
// import time. Node has both.
const { TextDecoder, TextEncoder } = require("util");

if (typeof global.TextEncoder === "undefined") {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === "undefined") {
  global.TextDecoder = TextDecoder;
}
