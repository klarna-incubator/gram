import { Box } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useListModelsQuery } from "../../api/gram/model";
import { CenteredPage } from "../elements/CenteredPage";
import Loading from "../loading";

export function LatestSystem() {
  const { systemId } = useParams();
  const navigate = useNavigate();
  const result = useListModelsQuery({
    filter: "system",
    systemId,
    limit: 1,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (result?.data?.length) {
      navigate(`/model/${result.data[0].id}`);
    } else if (result.error) {
      setError(result.error.message);
    } else if (result?.data?.length === 0) {
      setError("No models found for this system");
    }
  }, [navigate, setError, result]);

  return (
    <CenteredPage>
      <Box>{error ? <p>An error occured: {error}</p> : <Loading />}</Box>{" "}
    </CenteredPage>
  );
}
