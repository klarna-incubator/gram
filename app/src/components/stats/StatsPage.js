import { Paper, Typography } from "@mui/material";
import { CenteredPage } from "../elements/CenteredPage";
import Grid from "@mui/material/Grid2";
import { LineChart } from "@mui/x-charts/LineChart";
import { BarChart } from "@mui/x-charts/BarChart";
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { useState } from "react";

function MonthlyDates(length) {
  const today = new Date();
  const dates = Array.from({ length }, (_, i) => {
    const date = new Date(today);
    date.setMonth(date.getMonth() - i);
    return date;
  });
  return dates;
}

function DailyDates(length) {
  const today = new Date();
  const dates = Array.from({ length }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    return date;
  });
  return dates;
}

function QuarterlyDates(length) {
  const today = new Date();
  const dates = Array.from({ length }, (_, i) => {
    const date = new Date(today);
    date.setMonth(date.getMonth() - i * 3);
    return date;
  });
  return dates;
}

export function StatsPage() {
  const [interval, setInterval] = useState('month');

  const handleChange = (
    event,
    newAlignment,
  ) => {
    setInterval(newAlignment);
  };


  let dateAxis = { data: DailyDates(31), scaleType: 'time', label: 'Date' };
  if (interval === 'year') {
    dateAxis = { data: MonthlyDates(12), scaleType: 'time', label: 'Date' };
  } else if (interval === 'all time') {
    dateAxis = {
      data: QuarterlyDates(12), scaleType: 'time', label: 'Date', valueFormatter: (date, context) =>
        `${date.getMonth()} ${date.getYear()}`, // TODO: Use a better formatter, set different on tick/label
    };
  }

  return (
    <CenteredPage>
      <Grid size={12}>
        <Typography variant="h5">Stats</Typography>
        <br />
        <Typography>Metics for your threat modeling process.</Typography>
        <br />

        <ToggleButtonGroup
          color="primary"
          value={interval}
          exclusive
          onChange={handleChange}
          aria-label="Time interval"
          size="small"
        >
          <ToggleButton value="month">month</ToggleButton>
          <ToggleButton value="year">year</ToggleButton>
          <ToggleButton value="all time">all time</ToggleButton>
        </ToggleButtonGroup>
      </Grid>
      <Grid size={6}>
        <Paper sx={{ padding: "20px" }}>
          <Typography variant="h6">Systems with an approved threat model (%)</Typography>
          <LineChart
            xAxis={[dateAxis]}
            yAxis={[{ max: 100, label: 'Percentage' }]}
            series={[
              {
                data: [2, null, null, 5.5, 2, 8.5, 1.5, 5],
              },

            ]}
            width={700}
            height={300}
            grid={{ vertical: true, horizontal: true }}
            loading={false}
            title="Systems with an approved threat model (%)"
          />
        </Paper>
      </Grid>
      <Grid size={6}>
        <Paper sx={{ padding: "20px" }}>
          <Typography variant="h6">Systems with an approved threat model (Total)</Typography>
          <LineChart
            xAxis={[dateAxis]}
            series={[
              {
                data: [2, 5.5, 2, 8, 1.5, 5],
              },
              {
                data: [8, 9, 8, 8, 10, 10], label: 'Total Systems',
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
            grid={{ horizontal: true }}
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
