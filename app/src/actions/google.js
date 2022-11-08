import { renderButton, signIn, signOut } from "../api/google";

export const GOOGLE_LOGIN_PENDING = "GOOGLE_LOGIN_PENDING";
export const GOOGLE_LOGIN_SUCCESS = "GOOGLE_LOGIN_SUCCESS";
export const GOOGLE_LOGIN_ERROR = "GOOGLE_LOGIN_ERROR";
export const GOOGLE_LOGOUT_SUCCESS = "GOOGLE_LOGOUT_SUCCESS";
export const GOOGLE_LOGOUT_ERROR = "GOOGLE_LOGOUT_ERROR";

export const googleSignIn = (authParams) => async (dispatch) => {
  dispatch({ type: GOOGLE_LOGIN_PENDING });

  const { clientId } = authParams.google;

  const googleCallback = (GUser) => {
    const credentials = { idToken: GUser.getAuthResponse().id_token };
    dispatch({
      type: GOOGLE_LOGIN_SUCCESS,
      credentials,
    });
  };

  const errorCallback = (error) => {
    console.error(error);
    dispatch({
      type: GOOGLE_LOGIN_ERROR,
      error,
    });
  };

  // Attempt to automatically signIn
  return signIn(clientId).then(googleCallback, (error) => {
    // Action required from user
    if (error === "sign_in_required") {
      dispatch({
        type: GOOGLE_LOGIN_PENDING,
        signInRequired: true,
      });

      renderButton().then(googleCallback, errorCallback);
    } else {
      errorCallback(error);
    }
  });
};

export function googleSignout(clientId) {
  return async (dispatch) =>
    signOut(clientId).then(
      () => dispatch({ type: GOOGLE_LOGOUT_SUCCESS }),
      (error) => {
        console.error(error);
        dispatch({
          type: GOOGLE_LOGOUT_ERROR,
          error,
        });
      }
    );
}
