import { Box } from "@mui/material";

export function LoadingDots(props) {
  const seconds = props.seconds || 0.5;
  const height = props.height || 20;

  return (
    <Box
      sx={{
        display: "inline-block",
        position: "relative",
        height: `${height}px`,
        width: `${4.7 * height}px`,

        "& div": {
          backgroundColor: (theme) => theme.palette.common.gramPink,
          position: "absolute",
          width: `${height}px`,
          height: `${height}px`,
          borderRadius: "50%",
          animationTimingFunction: "cubic-bezier(0, 1, 1, 0)",

          "&:nth-of-type(1)": {
            left: `0`,
            animation: `loading-spinner1 ${seconds}s infinite`,
          },
          "&:nth-of-type(2)": {
            left: `0`,
            animation: `loading-spinner2 ${seconds}s infinite`,
          },
          "&:nth-of-type(3)": {
            left: `${1.85 * height}px`,
            animation: `loading-spinner2 ${seconds}s infinite`,
          },
          "&:nth-of-type(4)": {
            left: `${3.7 * height}px`,
            animation: `loading-spinner3 ${seconds}s infinite`,
          },
        },
        "@keyframes loading-spinner1": {
          "0%": {
            transform: "scale(0)",
          },
          "100%": {
            transform: "scale(1)",
          },
        },
        "@keyframes loading-spinner3": {
          "0%": {
            transform: "scale(1)",
          },
          "100%": {
            transform: "scale(0)",
          },
        },
        "@keyframes loading-spinner2": {
          "0%": {
            transform: "translate(0, 0)",
          },
          "100%": {
            transform: `translate(${1.85 * height}px, 0)`,
          },
        },
      }}
    >
      <div />
      <div />
      <div />
      <div />
    </Box>
  );
}
