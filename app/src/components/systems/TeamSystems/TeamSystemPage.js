import { Box, Typography } from "@mui/material";
import React from "react";
import { useParams } from "react-router-dom";
import { useGetUserQuery } from "../../../api/gram/auth";
import { useTitle } from "../../../hooks/useTitle";
import "../Systems.css";
import { TeamSystemsPageList } from "./TeamSystemsPageList";

export function TeamSystemsPage() {
  const { teamId } = useParams("/team/:teamId");
  const { data: user } = useGetUserQuery();

  let teams;
  if (teamId) {
    teams = [teamId];
  } else {
    teams = user.teams.map((t) => t.id);
  }

  useTitle("Team");

  return (
    <Box id="systems" className="container">
      {!teamId && <Typography variant={"h4"}>Your Team Systems</Typography>}

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          width: "100%",
          flexWrap: "wrap",
          justifyContent: "space-between",
        }}
      >
        {/* Some employees have more than one team */}
        {teams.map((tid) => (
          <TeamSystemsPageList key={tid} teamId={tid} />
        ))}
      </div>
    </Box>
  );
}
