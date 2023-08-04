import { Box, Button, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useGetAuthParamsQuery } from "../../api/gram/auth";
import Loading from "../loading";
import "./Login.css";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { EmailForm } from "./EmailForm";

export function Login() {
  const {
    data: authParams,
    isLoading,
    isError,
    isSuccess,
  } = useGetAuthParamsQuery();

  const [form, setForm] = useState(null);

  const [searchParams] = useSearchParams();

  useEffect(() => {
    const returnPath = searchParams.get("return") || "/";
    localStorage.setItem("returnPath", decodeURIComponent(returnPath));
  }, [searchParams]);

  return (
    <div id="login">
      {!form && <h2>Authentication required</h2>}
      {isLoading && <Loading />}
      {isError && <p>Failed to load authentication params. Try reloading.</p>}
      {isSuccess && authParams.length === 0 && (
        <Typography>
          <WarningAmberIcon /> No authentication methods configured.
        </Typography>
      )}
      {form === null &&
        authParams
          ?.filter((p) => !p.hideOnFrontend || !p.form)
          ?.map((provider) => (
            <Box key={`login-${provider.provider}`}>
              <Button
                onClick={() => setForm(provider.form?.type)}
                href={provider.form?.redirectUrl}
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
      {form === "email" && (
        <EmailForm form={form} formUrl={authParams[0].redirectUrl} />
      )}
    </div>
  );
}
