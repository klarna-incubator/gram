import {
  Box,
  CssBaseline,
  darkScrollbar,
  Toolbar,
  useMediaQuery,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import { getAuthToken } from "./api/gram/util/authToken";
import "./App.css";
import AdminPage from "./components/admin/AdminPage";
import { ModalManager } from "./components/elements/modal/ModalManager";
import ErrorPage from "./components/error-page";
import Home from "./components/home/Home";
import { Login } from "./components/login/Login";
import { LoginCallback } from "./components/login/LoginCallback";
import { Model } from "./components/model/Model";
import { NewWizard } from "./components/model/New";
import { Navbar } from "./components/navbar/Navbar";
import { Reviews } from "./components/reviews/Reviews";
import System from "./components/system/System";
import Search from "./components/systems/Search/Search";
import { TeamSystemsPage } from "./components/systems/TeamSystems/TeamSystemPage";
import UserModels from "./components/user-models/UserModels/UserModels";
import { authActions } from "./redux/authSlice";

function LoginRedirect() {
  const navigate = useNavigate();
  const authenticated = useSelector(({ auth }) => auth.authenticated);
  const dispatch = useDispatch();

  useEffect(() => {
    const path = window.location.pathname + window.location.search;
    const existingToken = getAuthToken();
    if (!existingToken && !authenticated && !path.startsWith("/login")) {
      navigate(`/login?return=${encodeURIComponent(path)}`);
    }
    if (existingToken && !authenticated) {
      dispatch(authActions.authenticate());
    }
  }, [authenticated, dispatch, navigate]);

  return <></>;
}

export default function App() {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const authenticated = useSelector(({ auth }) => auth.authenticated);

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
              <LoginRedirect />
              <ModalManager />
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  path="/login/callback/:provider"
                  element={<LoginCallback />}
                />
                {authenticated && (
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
                    <Route path="/admin" element={<AdminPage />} />
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
