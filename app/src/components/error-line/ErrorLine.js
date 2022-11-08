import React, { Component } from "react";
import PropTypes from "prop-types";
import "./ErrorLine.css";

class ErrorLine extends Component {
  render = () => {
    return <div className="error-line">{this.props.message}</div>;
  };
}

ErrorLine.propTypes = {
  message: PropTypes.string.isRequired,
};

export default ErrorLine;
