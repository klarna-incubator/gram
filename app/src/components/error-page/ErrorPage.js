import React, { Component } from "react";
import PropTypes from "prop-types";
import "./ErrorPage.css";

const desc = {
  404: "The page you are looking for does not exist",
  403: "You are not allowed to access this resource",
  500: "Something went terribly wrong. Try checking browser console for errors",
};

class ErrorPage extends Component {
  render = () => {
    return (
      <div id="error-page">
        <p className="big">{this.props.code.toString()}</p>
        <p className="desc">{desc[this.props.code.toString()]}</p>
      </div>
    );
  };
}

ErrorPage.propTypes = {
  code: PropTypes.number.isRequired,
};

export default ErrorPage;
