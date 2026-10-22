import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Logo } from "@zsyio/ui";
import { workspaceLoginUrl } from "./app-urls";

export function MarketingHeader() {
  return <header className="landing-nav">
    <Link href="/" aria-label="Zsyio home"><Logo /></Link>
    <nav aria-label="Main navigation">
      <Link href="/#apps">The suite</Link>
      <Link href="/#platform">Why Zsyio</Link>
      <Link href="/#questions">Questions</Link>
      <Link href="/careers">Careers</Link>
    </nav>
    <div className="nav-actions">
      <a className="login-link" href={workspaceLoginUrl}>Log in</a>
      <a href={workspaceLoginUrl} className="landing-button compact">Enter workspace<ArrowUpRight aria-hidden="true" size={16} /></a>
    </div>
  </header>;
}

export function MarketingFooter() {
  return <footer className="landing-footer section-shell">
    <Link href="/" aria-label="Zsyio home"><Logo /></Link>
    <p>One workspace. A wider perspective.</p>
    <Link href="/careers">Careers</Link>
    <span>© {new Date().getFullYear()} Zsyio</span>
  </footer>;
}
