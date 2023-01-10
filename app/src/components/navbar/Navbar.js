import {
  AppBar,
  Avatar,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from "@mui/material";
import React, { Fragment, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { useGetUserQuery, useLogoutMutation } from "../../api/gram/auth";
import { useGetMenuQuery } from "../../api/gram/menu";
import { setAuthToken } from "../../api/gram/util/authToken";
import { Banner } from "./Banner";
import { Search } from "./Search";

export function Navbar() {
  const { data: user } = useGetUserQuery();
  const authenticated = useSelector(({ auth }) => auth.authenticated);
  const navigate = useNavigate();
  const { data: menu, isLoading } = useGetMenuQuery();
  const menuPages = isLoading || !menu ? [] : menu;

  const pages = [
    { name: "Team", path: "/team" },
    { name: "My Models", path: "/models" },
    {
      name: "Reviews",
      path: "/reviews?statuses=requested%2Cdeclined",
    },
    ...menuPages,
  ];

  const [logout] = useLogoutMutation();

  const profileActions = [
    {
      name: "Logout",
      action: () => {
        setAuthToken(null);
        logout();
        navigate("/login");
      },
    },
  ];

  const [anchorElUser, setAnchorElUser] = useState(null);

  function handleOpenUserMenu(event) {
    setAnchorElUser(event.currentTarget);
  }

  function handleCloseUserMenu() {
    setAnchorElUser(null);
  }

  return (
    <AppBar
      position="fixed"
      color="primary"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        fontWeight: "light",
      }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "flex-end", gap: "1em" }}>
        <Button
          disableRipple
          component={Link}
          to="/"
          sx={{
            textTransform: "lowercase",
            color: (theme) => theme.palette.text.primary,
            "&:hover": {
              color: (theme) => theme.palette.common.gramPink,
              backgroundColor: "transparent",
            },
            marginRight: "auto",
          }}
        >
          <Typography
            variant="h5"
            noWrap
            component="span"
            color={(theme) => theme.palette.common.gramPink}
            sx={{ fontWeight: "bold" }}
          >
            g
          </Typography>
          <Typography variant="h5" noWrap component="span">
            ram
          </Typography>
        </Button>

        {authenticated && user && <Search />}

        <Box
          sx={{
            display: "flex",
            "& a": {
              "&:hover": {
                color: (theme) => theme.palette.common.gramPink,
                backgroundColor: "transparent",
              },
            },
          }}
        >
          {pages.map((page) =>
            !page.path.startsWith("/") ? (
              <Button
                disableRipple
                target="_blank"
                // component={Link}
                href={page.path}
                key={page.name}
                sx={{
                  color: (theme) => theme.palette.text.primary,
                }}
              >
                {page.name}
              </Button>
            ) : (
              <Fragment key={page.name}>
                {authenticated && user && (
                  <Button
                    disableRipple
                    component={Link}
                    to={page.path}
                    key={page.name}
                    sx={{
                      color: (theme) =>
                        window.location.pathname === page.path.split("?")[0]
                          ? theme.palette.common.gramPink
                          : theme.palette.text.primary,
                    }}
                  >
                    {page.name}
                  </Button>
                )}
              </Fragment>
            )
          )}
        </Box>
        {authenticated && user ? (
          <Box sx={{ flexGrow: 0 }}>
            <IconButton
              disableRipple
              onClick={(e) => handleOpenUserMenu(e)}
              sx={{ p: 0 }}
            >
              <Avatar alt={user.name} src={user.picture} />
            </IconButton>
            <Menu
              sx={{ mt: "45px" }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              {profileActions.map((action) => (
                <MenuItem
                  key={action.name}
                  onClick={() => {
                    handleCloseUserMenu();
                    action.action();
                  }}
                >
                  <Typography textAlign="center">{action.name}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>
        ) : (
          <Button
            disableRipple
            component={Link}
            to="/login"
            sx={{
              color: (theme) =>
                window.location.pathname === "/login"
                  ? theme.palette.common.gramPink
                  : theme.palette.text.primary,
              "&:hover": {
                backgroundColor: "transparent",
              },
            }}
          >
            Login
          </Button>
        )}
      </Toolbar>
      <Banner />
    </AppBar>
  );
}
