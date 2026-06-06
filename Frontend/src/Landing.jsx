// Landing.jsx
import Auth from './auth.jsx';
import AdminLogin from './AdminLogin.jsx';
import './auth.css'; // this already contains .landing-* styles

function Landing({ onAuthSuccess }) {
  return (
    <div className="landing-shell">
      <div className="landing-bg-pattern" />

      {/* Top nav */}
      <header className="landing-nav">
        <div className="landing-logo">
          <span className="landing-logo-icon"></span>
          <span className="landing-logo-text">STEM Knowledge Portal</span>
        </div>

        <button
          type="button"
          className="landing-nav-btn"
          onClick={() => {
            const el = document.getElementById('landing-auth');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          Login / Sign up
        </button>
      </header>

      {/* Hero + Auth side-by-side */}
      <main className="landing-hero">
        {/* Left: text */}
        <section>
          <p className="landing-eyebrow">Physics · Mathematics · CS · Biology · Finance</p>
          <h1 className="landing-headline">
            Your <em>STEM</em> Knowledge Hub
          </h1>
          <p className="landing-subtext">
            Explore real research papers from arXiv across physics, mathematics, computer science,
            biology, and finance — with rich summaries, key concepts, and role-based dashboards.
          </p>

          <div className="landing-cta-group">
            <button
              type="button"
              className="landing-cta-primary"
              onClick={() => {
                const el = document.getElementById('landing-auth');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Get started now
            </button>
            <span className="landing-cta-note">

            </span>
          </div>
        </section>

        {/* Right: visual + auth card */}
        <aside className="landing-hero-visual" id="landing-auth">
          {/* Optional floating cards visual removed for brevity, you can add later */}
          <div className="auth-card">
            <div className="auth-header">
              <h1>Sign in to continue</h1>
            </div>

            {/* Your existing Auth form */}
            <Auth onAuthSuccess={onAuthSuccess} />
          </div>
        </aside>
      </main>

      {/* Simple features section */}
      <section className="landing-features">
        <article className="landing-feature-card">
          <span className="lf-icon"></span>
          <h3 className="lf-title">Student portal</h3>
          <p className="lf-desc">
            Browse research papers and topics across physics, math, CS, biology, and finance.
          </p>
        </article>
        <article className="landing-feature-card">
          <span className="lf-icon"></span>
          <h3 className="lf-title">Librarian tools</h3>
          <p className="lf-desc">
            Manage catalog data and review resource details in one clean interface.
          </p>
        </article>
        <article className="landing-feature-card">
          <span className="lf-icon"></span>
          <h3 className="lf-title">Staff dashboard</h3>
          <p className="lf-desc">
            Track borrows, returns, and member activity efficiently.
          </p>
        </article>
      </section>

      <footer className="landing-footer">
        <p>@2500032630 Sec913 </p>
      </footer>

      {/* Discreet admin-only entrance at bottom-left */}
      <AdminLogin onAuthSuccess={onAuthSuccess} />
    </div>
  );
}

export default Landing;
