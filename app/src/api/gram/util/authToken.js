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
  // const response = await fetch(`/api/v1/auth/csrf`);
  // const newCsrfToken = (await response.json()).token;
  // jwt_decode(newCsrfToken); // validate that it's actually a jwt to avoid storing undefined.
  // localStorage.setItem("csrf", newCsrfToken);
  // return newCsrfToken;
}

export function setAuthToken(authToken) {
  localStorage.setItem("authToken", authToken);
}
