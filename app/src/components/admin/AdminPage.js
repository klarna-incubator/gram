import { Button } from "@mui/material";
import React from "react";
import { useSetRolesMutation } from "../../api/gram/admin";
import { useGetUserQuery } from "../../api/gram/user";
import { useGetTemplatesQuery } from "../../api/gram/model";
import "./AdminPage.css";

export default function AdminPage() {
  const { data: user } = useGetUserQuery();

  const { data: templates } = useGetTemplatesQuery();
  const [setRoles] = useSetRolesMutation();

  return (
    <div className="container">
      <h1 id="intro" className="with-bottom-padding">
        Admin{" "}
        {user?.roles.includes("admin")
          ? ""
          : "(You are not admin, some of the functions here won't work)"}
      </h1>

      <p className="dimmed">
        This page contains some admin widgets to help with day-to-day operations
        of Gram. By design, these <b>shouldn't</b> be anyhing too sensitive,
        just stuff to help debug / maintain the application.
      </p>

      <div className="row">
        <div className="column">
          <h2>Change Role</h2>
          <div className="spacer"></div>
          <p className="dimmed">
            Useful if you need to debug authz. Use the below form to set your
            new roles. Login again to get back your admin role.
          </p>
          <div>
            <Button onClick={() => setRoles({ roles: ["user"] })}>
              Become User Role
            </Button>
            <Button onClick={() => setRoles({ roles: ["user", "reviewer"] })}>
              Become Reviewer + User Role
            </Button>
          </div>
        </div>
        <div className="column">
          <h2>Templates</h2>
          <div className="spacer"></div>
          <p className="dimmed">Models listed as templates.</p>
          <div>
            <ul>
              {templates &&
                templates.map((template) => (
                  <li>
                    <a href={`/model/${template.id}`}> {template.version}</a>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
