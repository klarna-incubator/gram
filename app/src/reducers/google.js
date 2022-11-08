import {
  GOOGLE_LOGIN_PENDING,
  GOOGLE_LOGIN_SUCCESS,
  GOOGLE_LOGIN_ERROR,
  GOOGLE_LOGOUT_SUCCESS,
  GOOGLE_LOGOUT_ERROR,
} from "../actions/google";

export default function googleLoginReducer(state = {}, action) {
  switch (action.type) {
    case GOOGLE_LOGIN_PENDING:
      return { signInRequired: action.signInRequired };
    case GOOGLE_LOGIN_ERROR:
      return { signInRequired: false, error: action.error };
    case GOOGLE_LOGIN_SUCCESS:
      return {
        signInRequired: false,
        credentials: action.credentials,
      };
    case GOOGLE_LOGOUT_ERROR:
    case GOOGLE_LOGOUT_SUCCESS:
      return {};
    default:
      return state;
  }
}
