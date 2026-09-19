import type { AuthState } from '../../hooks/useAuth';

function AuthPage({ auth }: { auth: AuthState }) {
  return (
    <main className="auth">
      <div className="terminal">
        <header>
          <span>COMMUNITY_CHAT</span>
          <span>v0.1.0</span>
        </header>

        <div className="auth-body">
          <p className="dim">&gt; authentication required</p>

          <h1>{auth.mode === 'login' ? 'LOGIN' : 'REGISTER'}</h1>

          <form onSubmit={auth.handleAuth}>
            {auth.mode === 'register' && (
              <label>
                USERNAME
                <input
                  value={auth.username}
                  onChange={(e) => auth.setUsername(e.target.value)}
                  required
                />
              </label>
            )}

            <label>
              EMAIL
              <input
                type="email"
                value={auth.email}
                onChange={(e) => auth.setEmail(e.target.value)}
                required
              />
            </label>

            <label>
              PASSWORD
              <input
                type="password"
                value={auth.password}
                onChange={(e) => auth.setPassword(e.target.value)}
                required
              />
            </label>

            {auth.authError && <p className="error">! {auth.authError}</p>}

            <button type="submit">[{auth.mode === 'login' ? ' LOGIN ' : ' REGISTER '}]</button>
          </form>

          <button className="link-button" onClick={auth.toggleMode}>
            &gt; {auth.mode === 'login' ? 'register new user' : 'back to login'}
          </button>
        </div>
      </div>
    </main>
  );
}

export default AuthPage;