import {
  Button,
  Typography,
  ButtonGroup,
  List,
  Link,
  ListItemText,
  ListItem,
} from "@mui/material";
import React from "react";
import { useSetRolesMutation } from "../../api/gram/admin";
import { useGetUserQuery } from "../../api/gram/user";
import { useGetTemplatesQuery } from "../../api/gram/model";
import { CenteredPage } from "../elements/CenteredPage";
import Grid from "@mui/material/Grid2";

export default function AdminPage() {
  const { data: user } = useGetUserQuery();

  const { data: templates } = useGetTemplatesQuery();
  const [setRoles] = useSetRolesMutation();

  return (
    <CenteredPage>
      <Grid container spacing={2} size={12}>
        <Typography variant="h5">Admin</Typography>
        <Typography variant="subtitle1">
          {user?.roles.includes("admin")
            ? ""
            : "(You are not admin, some of the functions here won't work)"}
        </Typography>
        <Typography variant="body" sx={{ color: "#aaa" }}>
          This page contains some admin widgets to help with day-to-day
          operations of Gram. By design, these <b>shouldn't</b> be anything too
          sensitive, just stuff to help debug / maintain the application.
        </Typography>
      </Grid>
      <Grid container spacing={2} size={6}>
        <Typography variant="h5">Change Role</Typography>
        <Typography variant="body" sx={{ color: "#aaa" }}>
          Useful if you need to debug authz. Use the below form to set your new
          roles. Login again to get back your admin role.
        </Typography>

        <ButtonGroup
          variant="contained"
          aria-label="contained primary button group"
        >
          <Button onClick={() => setRoles({ roles: ["user"] })}>
            Become User Role
          </Button>
          <Button onClick={() => setRoles({ roles: ["user", "reviewer"] })}>
            Become Reviewer + User Role
          </Button>
        </ButtonGroup>
      </Grid>
      <Grid>
        <Typography variant="h5">Templates</Typography>
        <Typography variant="body" sx={{ color: "#aaa" }}>
          Models listed as templates.
        </Typography>
        <List>
          {templates?.map((template) => (
            <ListItem key={template.id}>
              <Link href={`/model/${template.id}`}>
                <ListItemText primary={template.version} />
              </Link>
            </ListItem>
          ))}
        </List>
      </Grid>
    </CenteredPage>
  );
}
