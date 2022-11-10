import { Box, Button, Icon } from "@mui/material";
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useGetAuthParamsQuery, useGetGramTokenMutation, useGetUserQuery } from "../../api/gram/auth";
import Loading from "../loading";
import "./Login.css";

export function Login() {
  const { data: authParams, isLoading } = useGetAuthParamsQuery();
  const { data: user } = useGetUserQuery();
  console.log(authParams);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // In case user is already authed
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
            startIcon={provider.icon && <Icon accessKey={provider.icon}></Icon>}
            variant="outlined"
          >
            Login via {provider.provider}
          </Button>
        </Box>
      ))}
    </div>
  );
}
