import React from "react";
import { useGetUserQuery } from "../../api/gram/auth";
import { useListModelsQuery } from "../../api/gram/model";
import { ModelList } from "../elements/list/ModelList";
import { TeamSystemsPageList } from "../systems/TeamSystems/TeamSystemsPageList";
import "./Home.css";

export default function Home() {
  const { data: user } = useGetUserQuery();

  const {
    data: recentModels,
    isError,
    isLoading,
  } = useListModelsQuery({
    filter: "recent",
    withSystems: true,
  });

  return (
    <div className="container">
      <h1 id="intro" className="with-bottom-padding">
        <span className="dimmed">Welcome back,</span>
        &nbsp;
        {user?.name}
      </h1>

      <div className="row">
        <div className="column">
          <h2>Recent Models</h2>
          <div className="spacer"></div>
          <p className="dimmed">Threat models you recently interacted with</p>
          <ModelList
            models={recentModels}
            width="100%"
            listHeight="940px"
            error={isError}
            pending={isLoading}
          />
        </div>
        {user?.teams?.length > 0 && (
          <div className="column">
            <h2>Team Systems</h2>
            <div className="spacer"></div>
            <p className="dimmed">
              Systems owned by the accountable teams you're in
            </p>
            <div className="teams">
              {user?.teams &&
                user.teams.map((team) => (
                  <TeamSystemsPageList
                    key={team.id}
                    teamId={team.id}
                    teamName={team.name}
                    width={"100%"}
                    listHeight={user.teams.length > 1 ? "350px" : "852px"}
                  />
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
