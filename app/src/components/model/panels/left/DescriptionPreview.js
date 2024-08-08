import { marked } from "marked";
import DOMPurify from "dompurify";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

marked.use({
  extensions: [
    {
      name: "heading",
      renderer({ text, depth }) {
        return `<h${depth + 1}>${text}</h${depth + 1}>`;
      },
    },
    {
      name: "image",
      renderer(_) {
        return "Images are not supported";
      },
    },
    {
      name: "list",
      renderer(token) {
        const itemList = token.items.map((i) => {
          return (
            "<li style='margin-bottom:0'>" + i.raw.replace(/\n+$/, "") + "</li>"
          );
        });
        if (token.ordered) {
          return `<ol type="1">${itemList.join("\n")}</ol>`;
        } else {
          return `<ul>${itemList.join("\n")}</ul>`;
        }
      },
    },
  ],
});

export const DescriptionPreview = ({
  description,
  showDescriptionTextField,
  readOnly,
}) => {
  const sanitizedHtml = DOMPurify.sanitize(marked.parse(description));

  if (readOnly) {
    return (
      <>
        <Typography variant="body1">Description</Typography>
        <Box dangerouslySetInnerHTML={{ __html: sanitizedHtml }}></Box>
      </>
    );
  } else {
    return (
      <>
        <Typography variant="body1">Description</Typography>
        <Box
          onClick={showDescriptionTextField}
          dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        ></Box>
      </>
    );
  }
};
