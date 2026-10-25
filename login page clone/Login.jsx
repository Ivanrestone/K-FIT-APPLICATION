import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import logo from "./logo.jpg";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userRole", data.user.role);
        localStorage.setItem("userName", data.user.name);
        navigate("/dashboard");
      } else {
        setError(data.message || "Invalid email or password");
      }
    } catch (err) {
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <header className="login-header">
        <div className="login-header-inner">
          <div className="login-brand">
            <img src={logo} alt="K-FIT logo" className="login-header-logo" />
            <span>K-FIT</span>
          </div>
        </div>
      </header>

      <main className="login-main">
        <div className="login-card">
          <div className="login-content">
            <h1 className="login-welcome">K-FIT</h1>

            <div className="login-brand-mark">
              <img src={logo} alt="K-FIT logo" className="login-logo" />
              <div className="login-portal-label">MEMBER PORTAL</div>
            </div>

            <form onSubmit={handleLogin} className="login-form">
              <div className="login-input-wrapper">
                <input
                  type="email"
                  id="staffEmail"
                  required
                  placeholder="USERNAME"
                  autoComplete="username"
                  className="login-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="login-input-wrapper login-password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="staffPassword"
                  required
                  placeholder="PASSWORD"
                  autoComplete="current-password"
                  className="login-input login-password-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="login-visibility"
                >
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>

              {error && <div className="login-error">{error}</div>}

              <div className="login-submit-wrapper">
                <button
                  type="submit"
                  disabled={loading}
                  className="login-button"
                >
                  {loading ? "SIGNING IN..." : "SIGN IN"}
                </button>
              </div>
            </form>

            <div className="login-links">
              <a href="#reset" className="login-link">
                Forgot Password?
              </a>
              <div className="login-secondary-text">
                Don&apos;t have an account?
                <a href="/register" className="login-signup">
                  Sign Up.
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="login-footer">
        © 2025 K-FIT. All rights reserved.
      </footer>
    </div>
  );
}

export default Login;
