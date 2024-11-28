import { Paper, Typography } from "@mui/material";
import { CenteredPage } from "../elements/CenteredPage";
import Grid from "@mui/material/Grid2";
import { LineChart } from "@mui/x-charts/LineChart";
import { BarChart } from "@mui/x-charts/BarChart";
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { useState } from "react";

export function StatsPage() {
  const [platform, setPlatform] = useState('web');

  const handleChange = (
    event,
    newAlignment,
  ) => {
    setPlatform(newAlignment);
  };

  return (
    <CenteredPage>
      <Grid size={12}>
        <Typography variant="h5">Stats</Typography>
        <Typography>Stats about the application</Typography>
        <ToggleButtonGroup
        color="primary"
        value={platform}
        exclusive
        onChange={handleChange}
        aria-label="Platform"
        >
            <ToggleButton value="web">month</ToggleButton>
            <ToggleButton value="android">year</ToggleButton>
            <ToggleButton value="ios">all time</ToggleButton>
        </ToggleButtonGroup>
      </Grid>
      <Grid size={6}>
        <Paper sx={{ padding: "20px" }}>
          <Typography variant="h6">Systems with an approved threat model (%)</Typography>
          <LineChart
            xAxis={[{ data: [1, 2, 3, 5, 8, 10] }]}
            series={[
              {
                data: [2, 5.5, 2, 8.5, 1.5, 5],
              },
            ]}
            width={700}
            height={300}
            grid={{ vertical: true, horizontal: true }}
          />
        </Paper>
      </Grid>
      <Grid size={6}>
        <Paper sx={{ padding: "20px" }}>
          <Typography variant="h6">Systems with an approved threat model (Total)</Typography>
          <LineChart
            xAxis={[{ data: [1, 2, 3, 5, 8, 10] }]}
            series={[
              {
                data: [2, 5.5, 2, 8.5, 1.5, 5],
              },
            ]}
            width={700}
            height={300}
            grid={{ vertical: true, horizontal: true }}
          />
        </Paper>
      </Grid>
      <Grid size={6}>
        <Paper sx={{ padding: "20px" }}>
          <Typography variant="h6">Review Statuses</Typography>
          <BarChart
            xAxis={[{ scaleType: 'band', data: ['group A', 'group B', 'group C'] }]}
            series={[{ data: [4, 3, 5] }, { data: [1, 6, 3] }, { data: [2, 5, 6] }]}
            width={500}
            height={300}
            />
        </Paper>
      </Grid>
      <Grid size={6}>
        <Paper sx={{ padding: "20px" }}>
          <Typography variant="h6">Average Quality Score</Typography>
          <LineChart
            xAxis={[{ data: [1, 2, 3, 5, 8, 10] }]}
            series={[
              {
                data: [2, 5.5, 2, 8.5, 1.5, 5],
              },
            ]}
            width={700}
            height={300}
            grid={{ vertical: true, horizontal: true }}
          />
        </Paper>
      </Grid>
      <Grid size={6}>
        <Paper sx={{ padding: "20px" }}>
          <Typography variant="h6">Action Items Created</Typography>
          <LineChart
            xAxis={[{ data: [1, 2, 3, 5, 8, 10] }]}
            series={[
              {
                data: [2, 5.5, 2, 8.5, 1.5, 5],
              },
            ]}
            width={700}
            height={300}
            grid={{ vertical: true, horizontal: true }}
          />
        </Paper>
      </Grid>
    </CenteredPage>
  );
}
