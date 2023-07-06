import { Box, Button, TextField, Typography } from "@mui/material";
import { useState } from "react";
import Loading from "../loading";
import { useGetGramTokenMutation } from "../../api/gram/auth";

export function EmailForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [getGramToken, auth] = useGetGramTokenMutation();

  return (
    <Box>
      {!submitted && (
        <Box>
          <TextField
            label="Email"
            variant="outlined"
            onChange={(e) => setEmail(e.target.value)}
            error={email.length === 0}
            required
            type="email"
          />
          <Button
            onClick={async () => {
              if (email.length === 0) return;
              await getGramToken({ provider: "magic-link", params: { email } });
              setSubmitted(true);
            }}
            variant="contained"
          >
            Send link
          </Button>
        </Box>
      )}

      {auth.isLoading && <Loading />}

      {(auth.isSuccess || auth.isError) && (
        <Box>
          <Typography>{auth.data?.message}</Typography>
        </Box>
      )}
    </Box>
  );
}
