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

    (async () => {
      const auth = await getGramToken({ provider, params });
      if (auth?.data?.authenticated) {
        const returnPath = localStorage.getItem("returnPath");
        navigate(returnPath?.startsWith("/") ? returnPath : "/");
      }
    })();
  }, [provider, searchParams, getGramToken, navigate]);

  return (
    <div id="login">
      <Box>
        {auth.isError ? (
          <p>An error occured while authenticating.</p>
        ) : (
          <p>Authenticating...</p>
        )}
      </Box>
      {auth.isLoading && <Loading />}
    </div>
  );
}
