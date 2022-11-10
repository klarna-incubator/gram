import { Box } from "@mui/material";
import React, { useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useGetGramTokenMutation } from "../../api/gram/auth";
import Loading from "../loading";
import "./Login.css";

export function LoginCallback() {
  const { provider } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [getGramToken, auth] = useGetGramTokenMutation();

  useEffect(() => {
    const params = {};
    for (let [key, value] of searchParams.entries()) {
      // Avoid potential prototype injection
      if (!key.startsWith("_")) {
        params[key] = value;
      }
    }
    getGramToken({ provider, params });
  }, [provider, searchParams, getGramToken]);

  useEffect(
    () =>
      auth?.data?.authenticated &&
      navigate(searchParams.get("return")?.startsWith("/") ? searchParams.get("return") : "/")
  );

  // if (error === 403) {
  //   return <ErrorPage code={403} />;
  // }
  // if (error) {
  //   console.error(error);
  //   return <ErrorPage code={500} />;
  // }

  return (
    <div id="login">
      <Box>
        <p>Authenticating...</p>
      </Box>
      {auth.isLoading && <Loading />}
    </div>
  );
}
