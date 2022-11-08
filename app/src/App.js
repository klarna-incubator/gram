import {
  Box,
  CssBaseline,
  darkScrollbar,
  Toolbar,
  useMediaQuery,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import React, { useEffect } from "react";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import { useGetUserQuery } from "./api/gram/auth";
import "./App.css";
import { ModalManager } from "./components/elements/modal/ModalManager";
import ErrorPage from "./components/error-page";
import Home from "./components/home/Home";
import { Login } from "./components/login/Login";
import { Model } from "./components/model/Model";
import { NewWizard } from "./components/model/New";
import { Navbar } from "./components/navbar/Navbar";
import { Reviews } from "./components/reviews/Reviews";
import System from "./components/system/System";
import Search from "./components/systems/Search/Search";
import { TeamSystemsPage } from "./components/systems/TeamSystems/TeamSystemPage";
import UserModels from "./components/user-models/UserModels/UserModels";

function LoginRedirect() {
  const navigate = useNavigate();
  const path = window.location.pathname;

  useEffect(() => {
    !path.startsWith("/login") && navigate(`/login?return=${path}`);
  }, [navigate, path]);

  return <></>;
}

export default function App() {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const { data: user, isError, isFetching, isLoading } = useGetUserQuery();

  const theme = React.useMemo(
    () =>
      createTheme({
        typography: {
          fontFamily: "Open Sans",
        },
        palette: {
          mode: prefersDarkMode ? "dark" : "dark", // Illusion of choice
          common: {
            gramPink: "#ffb3c7",
          },
          primary: {
            main: "#ffb3c7",
          },
          secondary: {
            main: "#d7bbd4",
          },
          review: {
            text: "#000000",
          },
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              body:
                prefersDarkMode === "dark" ? darkScrollbar() : darkScrollbar(),
            },
          },
        },
      }),
    [prefersDarkMode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      <BrowserRouter>
        <Box
          sx={{
            height: "100%",
            width: "100%",
          }}
        >
          <Navbar />
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              width: "100%",
            }}
          >
            <Toolbar />
            <Box component="main" sx={{ flexGrow: 1, minHeight: 0 }}>
              <>
                {(!user || isError) && !isLoading && !isFetching && (
                  <LoginRedirect />
                )}
              </>
              <ModalManager />
              <Routes>
                <Route path="/login" element={<Login />} />
                {user && !isError && (
                  <>
                    <Route path="/" element={<Home />} />
                    <Route path="/system/:id" element={<System />} />
                    <Route path="/search" element={<Search />} />
                    <Route path="/team">
                      <Route index element={<TeamSystemsPage />} />
                      <Route path=":teamId" element={<TeamSystemsPage />} />
                    </Route>
                    <Route path="/models" element={<UserModels />} />
                    <Route path="/model">
                      <Route path="new" element={<NewWizard />} />
                      <Route path=":id" element={<Model />} />
                    </Route>
                    <Route path="/reviews" element={<Reviews />} />
                  </>
                )}
                <Route component={() => <ErrorPage code={404} />} />
              </Routes>
            </Box>
          </Box>
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  );
}
