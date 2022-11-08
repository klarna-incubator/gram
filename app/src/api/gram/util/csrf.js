import jwt_decode from "jwt-decode";

export async function getCsrfToken() {
  const csrfToken = localStorage.getItem("csrf");
  if (csrfToken) {
    // Client doesn't know secret, but can verify for expiry.
    const decoded = jwt_decode(csrfToken);
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
      return csrfToken;
    } else {
      console.info("csrf token has expired");
    }
  }

  const response = await fetch(`/api/v1/auth/csrf`);
  const newCsrfToken = (await response.json()).token;
  jwt_decode(newCsrfToken); // validate that it's actually a jwt to avoid storing undefined.
  localStorage.setItem("csrf", newCsrfToken);
  return newCsrfToken;
}
