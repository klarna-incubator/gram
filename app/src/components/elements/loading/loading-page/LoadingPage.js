import { Box, LinearProgress } from "@mui/material";

export function LoadingPage(props) {
  const { isLoading } = props;
  return <>{isLoading ? <LinearProgress /> : <Box height="4px" />}</>;
}
