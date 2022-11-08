import { Search as SearchIcon } from "@mui/icons-material";
import { InputBase } from "@mui/material";
import { alpha, styled } from "@mui/system";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const SearchBar = styled("div")(({ theme }) => ({
  position: "relative",
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  "&:hover": {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  width: "auto",
}));

const SearchIconWrapper = styled("div")(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: "100%",
  position: "absolute",
  pointerEvents: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: "inherit",
  "& .MuiInputBase-input": {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    width: "20ch",
  },
}));

export function Search() {
  const navigate = useNavigate();

  const [searchValue, setSearchValue] = useState("");

  function handleSearch() {
    if (searchValue) {
      navigate(`/search?query=${searchValue}`);
    }
  }

  return (
    <SearchBar>
      <SearchIconWrapper>
        <SearchIcon
          sx={{
            fill: (theme) => theme.palette.common.gramPink,
          }}
        />
      </SearchIconWrapper>
      <StyledInputBase
        placeholder="Search system…"
        inputProps={{ "aria-label": "search" }}
        onChange={(e) => setSearchValue(e.target.value)}
        onKeyPress={(e) => {
          if (e.key === "Enter") {
            handleSearch();
          }
        }}
      />
    </SearchBar>
  );
}
