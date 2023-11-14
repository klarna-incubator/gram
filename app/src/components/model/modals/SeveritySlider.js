import { ColorSlider } from "../../elements/ColorSlider";

const marks = [
  {
    label: "Informative",
    textValue: "informative",
    description: `Threats classified as "Informative" are primarily intended for information and awareness. They do not pose a direct risk to the system or organization.`,
  },
  {
    label: "Low",
    textValue: "low",
    description: `Threats with a "Low" severity have the potential to cause minimal or limited impact on the system or organization. These threats are unlikely to result in significant harm.`,
  },
  {
    label: "Medium",
    textValue: "medium",
    description: `Threats categorized as "Medium" severity have the potential to cause moderate impact and disruption. They are not immediate emergencies, but they should be addressed in a timely manner.`,
  },
  {
    label: "High",
    textValue: "high",
    description: `"High" severity threats have the potential to cause significant damage or disruption to the system or organization. They require immediate attention and failure to address these threats promptly can result in severe consequences.`,
  },
  {
    label: "Critical",
    textValue: "critical",
    description: `Threats classified as "Critical" have the potential to cause severe and immediate harm, such as data breaches, system compromises, or significant financial losses. These threats demand immediate mitigation efforts.`,
  },
];

export function SeveritySlider({ severity, onChange, ...props }) {
  return (
    <ColorSlider
      marks={marks}
      onChangeCommitted={(value) => {
        onChange(value);
      }}
      value={severity}
      {...props}
    />
  );
}
