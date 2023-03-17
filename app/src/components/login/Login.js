import { Box, Button, Typography } from "@mui/material";
import React, { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useGetAuthParamsQuery } from "../../api/gram/auth";
import Loading from "../loading";
import "./Login.css";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

export function Login() {
  const {
    data: authParams,
    isLoading,
    isError,
    isSuccess,
  } = useGetAuthParamsQuery();

  const [searchParams] = useSearchParams();

  useEffect(() => {
    const returnPath = searchParams.get("return") || "/";
    localStorage.setItem("returnPath", decodeURIComponent(returnPath));
  }, [searchParams]);

  return (
    <div id="login">
      <h2>Authentication required</h2>
      {isLoading && <Loading />}
      {isError && <p>Failed to load authentication params. Try reloading.</p>}
      {isSuccess && authParams.length === 0 && (
        <Typography>
          <WarningAmberIcon /> No authentication methods configured.
        </Typography>
      )}
      {authParams
        ?.filter((p) => !p.hideOnFrontend)
        ?.map((provider) => (
          <Box key={`login-${provider.provider}`}>
            <Button
              href={provider.redirectUrl}
              startIcon={
                provider.icon && (
                  <img
                    alt={`${provider.provider} icon`}
                    width={32}
                    src={provider.icon}
                  />
                )
              }
              variant="outlined"
            >
              Login via {provider.provider}
            </Button>
          </Box>
        ))}
    </div>
  );
}
