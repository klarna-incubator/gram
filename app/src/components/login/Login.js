import { Box, Button } from "@mui/material";
import React from "react";
import { useGetAuthParamsQuery } from "../../api/gram/auth";
import Loading from "../loading";
import "./Login.css";

export function Login() {
  const { data: authParams, isLoading } = useGetAuthParamsQuery();

  // In case user is already authed
  // const { data: user } = useGetUserQuery();
  // useEffect(() => user && navigate(searchParams.get("return")?.startsWith("/") ? searchParams.get("return") : "/"));

  return (
    <div id="login">
      <Box>
        <p>Authentication required</p>
      </Box>
      {isLoading && <Loading />}
      {authParams?.map((provider) => (
        <Box>
          <Button
            href={provider.redirectUrl}
            startIcon={provider.icon && <img alt={`${provider.provider} icon`} width={32} src={provider.icon} />}
            variant="outlined"
          >
            Login via {provider.provider}
          </Button>
        </Box>
      ))}
    </div>
  );
}
