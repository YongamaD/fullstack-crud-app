import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
      <h1 style={{ fontSize: "3rem", marginBottom: "1rem" }}>404</h1>
      <p style={{ color: "#6b7280", marginBottom: "2rem" }}>Page not found</p>
      <Link
        to="/"
        style={{
          color: "#3b82f6",
          textDecoration: "none",
        }}
      >
        Go back home
      </Link>
    </div>
  );
}
