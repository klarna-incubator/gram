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
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { googleSignout } from "../../actions/google";
import {
  useGetAuthParamsQuery,
  useGetUserQuery,
  useLogoutMutation,
} from "../../api/gram/auth";
import { Search } from "./Search";

export function Navbar() {
  const dispatch = useDispatch();
  const { data: authParams } = useGetAuthParamsQuery();
  const { data: user } = useGetUserQuery();

  const pages = [
    { name: "Team", path: "/team", external: false },
    { name: "My Models", path: "/models", external: false },
    {
      name: "Reviews",
      path: "/reviews?statuses=requested%2Cdeclined",
      external: false,
    },
    {
      name: "Feedback",
      //TODO make configurable?
      path: "",
      external: true,
    },
    {
      name: "Docs",
      //TODO make configurable?
      path: "",
      external: true,
    },
  ];

  const [logout] = useLogoutMutation();

  const profileActions = [
    {
      name: "Logout",
      action: () =>
        dispatch(googleSignout(authParams?.google?.clientId)) && logout(),
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

        {user && <Search />}

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
            page.external ? (
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
                {user && (
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
        {user ? (
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
                    dispatch(action.action());
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
    </AppBar>
  );
}
