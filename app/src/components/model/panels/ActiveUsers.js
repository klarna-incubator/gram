import React from "react";
import { useSelector } from "react-redux";
import "./ActiveUsers.css";

const initials = (name) =>
  name
    .split(" ")
    .filter((p) => p)
    .map((p) => p[0])
    .join("");

function ActiveUsers() {
  const activeUsers = useSelector(
    ({ webSocket: { activeUsers } }) => activeUsers
  );
  if (!activeUsers) return null;
  return (
    <div className="active-users-overlay">
      {activeUsers.map((u, i) => (
        <div
          key={`${u.name}-${i}`}
          style={{
            backgroundColor: u.color,
            border: "2px solid",
            borderColor: u.color,
          }}
          className="active-user-item"
          title={u.name}
        >
          {u.picture ? (
            <img src={u.picture} alt="" width={42} />
          ) : (
            initials(u.name)
          )}
        </div>
      ))}
    </div>
  );
}
export default ActiveUsers;
