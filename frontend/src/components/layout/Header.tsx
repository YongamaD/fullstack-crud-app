import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import "./Header.css";

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="header-logo">
          Posts App
        </Link>

        <nav className="header-nav">
          <Link to="/" className="nav-link">
            Posts
          </Link>
          {isAuthenticated && (
            <>
              <Link to="/my-posts" className="nav-link">
                My Posts
              </Link>
              <Link to="/posts/new" className="nav-link">
                Create Post
              </Link>
            </>
          )}
        </nav>

        <div className="header-auth">
          {isAuthenticated ? (
            <>
              <span className="user-email">{user?.email}</span>
              <button onClick={logout} className="logout-btn">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">
                Login
              </Link>
              <Link to="/register" className="nav-link nav-link-primary">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
