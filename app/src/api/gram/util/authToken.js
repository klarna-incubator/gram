import jwt_decode from "jwt-decode";

export function getAuthToken() {
  const authToken = localStorage.getItem("authToken");

  if (authToken) {
    // Client doesn't know secret, but can verify for expiry.
    try {
      const decoded = jwt_decode(authToken);
      // console.log(decoded);
      const date = new Date();
      const now_utc = Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        date.getUTCHours(),
        date.getUTCMinutes(),
        date.getUTCSeconds()
      );
      const utcdate = new Date(now_utc);

      // console.log(
      //   new Date(decoded.exp * 1000),
      //   utcdate,
      //   new Date(decoded.exp * 1000) > utcdate
      // );
      if (new Date(decoded.exp * 1000) > utcdate) {
        // Token is still valid, return it.
        return authToken;
      } else {
        console.info("authToken token has expired");
      }
    } catch (e) {
      console.error("login token failed to parse as jwt", e);
    }
  }

  return null;
}

export function setAuthToken(authToken) {
  localStorage.setItem("authToken", authToken);
}
