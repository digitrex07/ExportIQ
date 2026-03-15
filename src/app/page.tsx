import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="landing-page">
      <div className="landing-brand animate-fade-in">
        <div className="landing-brand-icon">EF</div>
        <h1 className="landing-title">
          Manage Your <span>Export Pipeline</span>
          <br />End to End
        </h1>
        <p className="landing-subtitle">
          From buyer inquiry to bill of lading — centralize your entire export workflow.
          Manage deals, track shipments, generate documents, and analyze profitability — all in one platform.
        </p>
        <div className="landing-actions">
          <Link href="/signup" className="btn btn-primary">
            Get Started Free
          </Link>
          <Link href="/login" className="btn btn-secondary">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
