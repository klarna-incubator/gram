import { Chip, IconButton } from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import ChatIcon from "@mui/icons-material/Chat";
import { useGetOtherUserByIdQuery } from "../../api/gram/user";

export function UserChip({ user, userId, ...props }) {
  if (user) {
    return <UserChipWithUser user={user} {...props} />;
  }
  if (userId) {
    return <UserChipWithId userId={userId} {...props} />;
  }
  return null;
}

function UserChipWithId({ userId, ...props }) {
  const { data: user } = useGetOtherUserByIdQuery({ userId });

  return <UserChipWithUser user={user} {...props} />;
}

function UserChipWithUser({ user, ...props }) {
  return (
    <Chip
      size="small"
      sx={{
        color: (theme) => theme.palette.review.text,
      }}
      variant="outlined"
      label={user?.name}
      component="span"
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
      {...props}
    />
  );
}
