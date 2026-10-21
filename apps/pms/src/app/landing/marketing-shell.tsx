import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Logo } from "@zsyio/ui";

export function MarketingHeader({ signedIn = false }: { signedIn?: boolean }) {
  return <header className="landing-nav">
    <Link href="/landing" aria-label="Zsyio home"><Logo /></Link>
    <nav aria-label="Main navigation">
      <Link href="/landing#apps">The suite</Link>
      <Link href="/landing#platform">Why Zsyio</Link>
      <Link href="/landing#questions">Questions</Link>
      <Link href="/landing/careers">Careers</Link>
    </nav>
    <div className="nav-actions">
      {!signedIn && <Link className="login-link" href="/login">Log in</Link>}
      <Link href={signedIn ? "/" : "/login"} className="landing-button compact">{signedIn ? "Open workspace" : "Enter workspace"}<ArrowUpRight aria-hidden="true" size={16} /></Link>
    </div>
  </header>;
}

export function MarketingFooter() {
  return <footer className="landing-footer section-shell">
    <Link href="/landing" aria-label="Zsyio home"><Logo /></Link>
    <p>One workspace. A wider perspective.</p>
    <Link href="/landing/careers">Careers</Link>
    <span>© {new Date().getFullYear()} Zsyio</span>
  </footer>;
}
