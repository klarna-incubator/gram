//TODO make configurable
const googleHostedDomain = "";

export function signIn(clientId) {
  return new Promise((resolve, reject) => {
    window.gapi.load("auth2", () =>
      window.gapi.auth2
        .init({
          hosted_domain: googleHostedDomain,
          client_id: clientId,
        })
        .then((GAuth) => {
          if (GAuth.isSignedIn.get()) resolve(GAuth.currentUser.get());
          else reject("sign_in_required");
        })
        .catch((error) => reject(error))
    );
  });
}

export function renderButton() {
  return new Promise((resolve, reject) => {
    window.gapi.signin2.render("g-signin-gram", {
      longtitle: true,
      theme: "dark",
      onsuccess: resolve,
      onfailure: reject,
    });
  });
}

export function signOut(clientId) {
  console.log(clientId);
  return new Promise((resolve, reject) => {
    window.gapi.load("auth2", () =>
      window.gapi.auth2
        .init({
          hosted_domain: googleHostedDomain,
          client_id: clientId,
        })
        .then((GAuth) => {
          GAuth.disconnect();
          resolve();
        })
    );
  });
}
