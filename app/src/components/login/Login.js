import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { googleSignIn } from "../../actions/google";
import {
  useGetAuthParamsQuery,
  useGetGramTokenMutation,
} from "../../api/gram/auth";
import ErrorPage from "../error-page";
import Loading from "../loading";
import "./Login.css";

export function Login() {
  const { error, credentials, signInRequired } = useSelector(
    ({ google: { credentials, error, signInRequired } }) => ({
      credentials,
      error,
      signInRequired,
    })
  );

  const dispatch = useDispatch();
  const { data: authParams } = useGetAuthParamsQuery();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [getGramToken, auth] = useGetGramTokenMutation();

  useEffect(
    () => authParams && dispatch(googleSignIn(authParams)),
    [dispatch, authParams]
  );

  useEffect(
    () => credentials && getGramToken({ provider: "google", credentials }),
    [credentials, getGramToken]
  );

  useEffect(
    () =>
      auth?.data?.authenticated &&
      navigate(
        searchParams.get("return") && searchParams.get("return").startsWith("/")
          ? searchParams.get("return")
          : "/"
      )
  );

  if (error === 403) {
    return <ErrorPage code={403} />;
  }
  if (error) {
    console.error(error);
    return <ErrorPage code={500} />;
  }

  return (
    <div id="login">
      <p>Authentication required</p>
      {!signInRequired && <Loading />}
      <div id="g-signin-gram"></div>
    </div>
  );
}
