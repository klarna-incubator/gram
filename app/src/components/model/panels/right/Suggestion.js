import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  useAcceptSuggestionMutation,
  useListSuggestionsQuery,
  useRejectSuggestionMutation,
  useResetSuggestionMutation,
} from "../../../../api/gram/suggestions";
import { useModelID } from "../../hooks/useModelID";
import { useSelectedComponent } from "../../hooks/useSelectedComponent";

export function Suggestion(props) {
  const { suggestion, rejected, readOnly, isControl } = props;

  const modelId = useModelID();
  const selectedComponent = useSelectedComponent();
  const { data: suggestions } = useListSuggestionsQuery(modelId);
  const threatSuggestions = suggestions?.threatsMap[selectedComponent.id] || [];

  const [acceptSuggestion] = useAcceptSuggestionMutation();
  const [rejectSuggestion] = useRejectSuggestionMutation();
  const [resetSuggestion] = useResetSuggestionMutation();

  return (
    <Card
      elevation={rejected ? 4 : 2}
      sx={{
        flexShrink: 0,
        border: 2,
        borderColor: "transparent",
      }}
    >
      <CardContent
        sx={{
          padding: "8px",
          paddingBottom: "16px !important",
        }}
      >
        <Box sx={{ display: "flex" }}>
          <Box sx={{ flexGrow: "1" }}>
            <Typography
              variant="body1"
              color="text.primary"
              sx={{
                lineHeight: "1.4",
                fontSize: "1.0rem",
              }}
            >
              {suggestion.title}
            </Typography>
            {suggestion.description && (
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{
                  paddingBottom: "10px",
                  lineHeight: "1.45",
                  fontSize: "0.75rem",
                }}
              >
                {suggestion.description}
              </Typography>
            )}
            {suggestion.mitigates && (
              <>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{
                    paddingBottom: "10px",
                    lineHeight: "1.45",
                    fontSize: "0.75rem",
                  }}
                >
                  Mitigates:
                </Typography>
                {suggestion.mitigates.map((m) => (
                  <Chip
                    label={
                      threatSuggestions.find((t) =>
                        t.id.includes(m.partialThreatId)
                      )?.title
                    }
                  />
                ))}
              </>
            )}
            {suggestion.reason && (
              <Tooltip title={suggestion.reason}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ textDecoration: "underline" }}
                >
                  Why was this suggested?
                </Typography>
              </Tooltip>
            )}

            <Box
              display="flex"
              gap="10px"
              justifyContent="flex-start"
              alignItems="center"
              paddingTop="10px"
            >
              {!readOnly &&
                (rejected ? (
                  <Button
                    variant="outlined"
                    size="small"
                    color="warning"
                    onClick={() => {
                      resetSuggestion({
                        modelId: suggestion.modelId,
                        suggestionId: suggestion.id,
                      });
                    }}
                  >
                    Reset
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="contained"
                      size="small"
                      color={isControl ? "success" : "error"}
                      onClick={() => {
                        acceptSuggestion({
                          modelId: suggestion.modelId,
                          suggestionId: suggestion.id,
                        });
                      }}
                      sx={{}}
                    >
                      Accept {isControl ? <>Control</> : <>Threat</>}
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      color="warning"
                      onClick={() => {
                        rejectSuggestion({
                          modelId: suggestion.modelId,
                          suggestionId: suggestion.id,
                        });
                      }}
                    >
                      Reject
                    </Button>
                  </>
                ))}
              <Tooltip title="The source of the suggestion">
                <small
                  style={{
                    fontSize: 9,
                    minWidth: 0,
                    width: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    color: "grey",
                    justifySelf: "flex-end",
                    textAlign: "right",
                    flexGrow: 1,
                  }}
                >
                  {suggestion.source}
                </small>
              </Tooltip>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
