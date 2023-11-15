import { ScreenshotMonitor } from "@mui/icons-material";
import { ToggleButton, Tooltip } from "@mui/material";
import Konva from "konva";

// This is just a quick hack but fun little feature. The exported image is a bit janky by itself as it comes with gridlines and no background,
// but it looks ok when copied into a doc. Would be cool to make an SVG instead.
function exportImage() {
  const data = Konva.stages[0].toDataURL({ pixelRatio: 3 });
  const a = document.createElement("a");
  a.href = data;
  a.download = "Image.png";
  a.click();
}

export function DownloadImageButton() {
  return (
    <ToggleButton value="download-image" onClick={() => exportImage()}>
      <Tooltip title={"Download as image"}>
        <ScreenshotMonitor value="export-image" />
      </Tooltip>
    </ToggleButton>
  );
}
