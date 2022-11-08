import React from "react";
import "./Progressbar.css";

export default function Progressbar({ seconds }) {
  const styles = {
    progress: {
      background: "rgba(255, 255, 255, 0.1)",
      justifyContent: "flex-start",
      borderRadius: "100px",
      alignItems: "center",
      position: "relative",
      padding: "0 5px",
      display: "flex",
      height: "25px",
      width: "100%",
    },

    progressValue: {
      animation: `load ${seconds}s normal forwards`,
      boxShadow: "0 10px 25px -10px #ffb3c7",
      borderRadius: "100px",
      background: "#ffb3c7",
      height: "15px",
      width: "0",
    },
  };

  return (
    <div style={styles.progress}>
      <div style={styles.progressValue}></div>
    </div>
  );
}
