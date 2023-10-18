import { Typography } from "@mui/material";
import { useGetTeamQuery } from "../../../api/gram/team";

export function TeamHeader({ teamId }) {
  const { data: team } = useGetTeamQuery({ teamId });

  return (
    <>
      <Typography variant={"h5"}>{team?.name} Systems</Typography>
      <Typography className="dimmed">{team?.description}</Typography>
    </>
  );
}
