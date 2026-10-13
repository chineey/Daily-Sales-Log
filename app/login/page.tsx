import { login } from "../actions";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const resolvedParams = await searchParams;
  const hasError = Boolean(resolvedParams?.error);

  return (
    <div className="login-wrapper">
      <div className="glass-card login-card">
        <div className="login-icon-box">🔐</div>

        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <h1 style={{ fontSize: "1.75rem", marginBottom: "0.4rem" }}>
            Daily Sales Log
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Enter your shop passcode to access today&apos;s transactions.
          </p>
        </div>

        {hasError && (
          <div className="alert-error" role="alert">
            <span>⚠️</span>
            <span>Incorrect passcode. Please check and try again.</span>
          </div>
        )}

        <form action={login}>
          <div className="form-group" style={{ marginBottom: "1.5rem" }}>
            <label htmlFor="passcode" className="form-label">
              Shop Passcode
            </label>
            <input
              id="passcode"
              name="passcode"
              type="password"
              required
              autoFocus
              className="form-input"
              placeholder="••••••••"
              style={{
                fontSize: "1.2rem",
                letterSpacing: "0.2em",
                textAlign: "center",
              }}
            />
          </div>

          <button
            type="submit"
            id="login-button"
            className="btn btn-primary"
            style={{ fontSize: "1.05rem" }}
          >
            Unlock Dashboard →
          </button>
        </form>

        <div
          style={{
            marginTop: "2rem",
            paddingTop: "1.25rem",
            borderTop: "1px solid var(--border-subtle)",
            textAlign: "center",
            fontSize: "0.8rem",
            color: "var(--text-dim)",
          }}
        >
          Protected by signed HTTP-only session tokens.
        </div>
      </div>
    </div>
  );
}
