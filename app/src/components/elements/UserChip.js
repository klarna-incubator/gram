import { Chip, IconButton } from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import ChatIcon from "@mui/icons-material/Chat";

export function UserChip({ user }) {
  return (
    <Chip
      size="small"
      sx={{
        color: (theme) => theme.palette.review.text,
      }}
      variant="outlined"
      label={user.name}
      icon={
        <>
          {user?.slackUrl && (
            <IconButton
              href={user?.slackUrl}
              target="_blank"
              rel="noreferrer"
              color="inherit"
              size="small"
            >
              <ChatIcon />
            </IconButton>
          )}
          {user?.mail && (
            <IconButton
              href={`mailto:${user?.mail}`}
              target="_blank"
              rel="noreferrer"
              color="inherit"
              size="small"
            >
              <EmailIcon />
            </IconButton>
          )}
        </>
      }
    />
  );
}
