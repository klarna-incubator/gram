import React from "react";
import { faGithub, faJira } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link as LinkIcon } from "@mui/icons-material";
import { Chip } from "@mui/material";

const icons = {
  jira: <FontAwesomeIcon icon={faJira} color="#fff" />,
  github: <FontAwesomeIcon icon={faGithub} color="#fff" />,
  "": <LinkIcon fontSize="16" />,
};

export function ExternalLink({ icon, href, target, ...props }) {
  return (
    <Chip
      component={"a"}
      //   target="_blank"
      icon={icons[icon] ? icons[icon] : null}
      size="small"
      sx={{
        textDecoration: "underline",
      }}
      //   clickable
      onClick={(e) => {
        window.open(href, target || "_blank", "noopener,noreferrer");
      }}
      {...props}
    />
  );
}
