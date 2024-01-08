import {
  DescriptionRounded as DescriptionRoundedIcon,
  Link as LinkIcon,
} from "@mui/icons-material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub, faJira } from "@fortawesome/free-brands-svg-icons";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { modalActions } from "../../../redux/modalSlice";
import { ExternalLink } from "../../elements/ExternalLink";
import { useCreateLinkMutation } from "../../../api/gram/links";

const jiraRe = new RegExp("atlassian.net/browse/([A-Z0-9-]+)");

export function AddLink({ objectType, objectId }) {
  const dispatch = useDispatch();

  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [icon, setIcon] = useState("");
  const [createLink, link] = useCreateLinkMutation();

  useEffect(() => {
    if (url.includes("github.com")) {
      setIcon("github");
    } else if (url.includes("atlassian.net")) {
      setIcon("jira");
      const matches = url.match(jiraRe);
      if (matches) {
        setLabel(matches[1]);
      }
    }
  }, [url, setLabel, setIcon]);

  useEffect(() => {
    if (link.isSuccess) {
      dispatch(modalActions.close());
    }
  }, [link, dispatch]);

  const valid = url && label;

  return (
    <Dialog open={true} scroll={"paper"} fullWidth maxWidth="sm">
      <DialogTitle>
        <Box display="flex" alignItems="center" gap="10px">
          <DescriptionRoundedIcon fontSize="large" />
          <Typography variant="h5">Add Link</Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ paddingTop: "0" }}>
        <Typography>
          Here you can add a custom link to a threat or control. This can be
          used to link to external resources or internal documentation.
        </Typography>

        <Box sx={{ paddingTop: "10px" }}>
          <TextField
            fullWidth
            label="Url"
            variant="outlined"
            placeholder="URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </Box>

        <Typography sx={{ paddingTop: "10px" }} variant="h6">
          Display
        </Typography>
        <Box>
          <FormControl>
            <Select
              labelId="icon-select-label"
              id="icon-select"
              displayEmpty
              value={icon}
              onChange={(e) => {
                setIcon(e.target.value);
              }}
            >
              <MenuItem value={"jira"}>
                <FontAwesomeIcon icon={faJira} color="#fff" />
              </MenuItem>
              <MenuItem value={"github"}>
                <FontAwesomeIcon icon={faGithub} color="#fff" />
              </MenuItem>
              <MenuItem value={""}>
                <LinkIcon fontSize="16" />
              </MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Label"
            variant="outlined"
            placeholder="Label"
            value={label}
            onChange={(e) => {
              setLabel(e.target.value);
            }}
          />
        </Box>

        <Typography sx={{ paddingTop: "10px" }} variant="h6">
          Preview
        </Typography>
        <Box>
          <ExternalLink
            href={url || "https://"}
            icon={icon}
            label={label || "Label"}
            size="small"
          />
        </Box>

        {link.isError && (
          <>
            <Typography variant="h6">Something went wrong :(</Typography>
            <Typography variant="caption">
              Error: {JSON.stringify(link.error.data.issues)}
            </Typography>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => dispatch(modalActions.close())}
          variant="outlined"
        >
          Close
        </Button>
        <Button
          onClick={() => createLink({ url, label, icon, objectType, objectId })}
          disabled={!valid || link.isLoading}
          variant="contained"
        >
          Add Link
          {link.isLoading && (
            <CircularProgress size={20} sx={{ position: "absolute" }} />
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
