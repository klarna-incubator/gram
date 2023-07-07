import {
  Box,
  Button,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import Loading from "../loading";
import { useGetGramTokenMutation } from "../../api/gram/auth";

export function EmailForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [getGramToken, auth] = useGetGramTokenMutation();

  const submit = async (e) => {
    e.preventDefault();
    if (email.length === 0) return;
    await getGramToken({
      provider: "magic-link",
      params: { email },
    });
    setSubmitted(true);
    return false;
  };

  return (
    <Box>
      {!submitted && (
        <Box sx={{ maxWidth: "md" }}>
          <form onSubmit={submit}>
            <TextField
              fullWidth
              label="Email"
              variant="outlined"
              onChange={(e) => setEmail(e.target.value)}
              error={email.length === 0}
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Button type="submit" variant="contained">
                      Send link
                    </Button>
                  </InputAdornment>
                ),
              }}
            />
          </form>
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
