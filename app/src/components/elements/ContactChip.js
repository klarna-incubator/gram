import { Chip, IconButton } from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import ChatIcon from "@mui/icons-material/Chat";
import { useGetContactQuery } from "../../api/gram/contact";

export function ContactChip(props) {
  const { data: contact } = useGetContactQuery();

  return (
    <Chip
      variant="outlined"
      label={contact?.name || "Your Gram Admins"}
      icon={
        <>
          {contact?.slackUrl && (
            <IconButton
              href={contact?.slackUrl}
              target="_blank"
              rel="noreferrer"
              color="inherit"
              size="small"
            >
              <ChatIcon />
            </IconButton>
          )}
          {contact?.mail && (
            <IconButton
              href={`mailto:${contact?.mail}`}
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
