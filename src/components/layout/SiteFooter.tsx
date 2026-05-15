import { Linkedin, Twitter, Globe } from 'lucide-react';

const LINKEDIN_URL  = 'https://www.linkedin.com/in/chunyang-wang-a30b00195/';
const TWITTER_URL   = 'https://x.com/chunyanginx';
const PORTFOLIO_URL = 'https://chunyangweb.github.io/home.html';

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-[hsl(88,22%,20%)] px-6 py-5">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-[hsl(82,15%,62%)]">
          © {new Date().getFullYear()} Wealthpath · Chunyang Wang
        </p>

        <div className="flex items-center gap-4">
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="text-[hsl(82,15%,62%)] transition-colors hover:text-[hsl(82,30%,80%)]"
          >
            <Linkedin className="h-4 w-4" />
          </a>
          <a
            href={TWITTER_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="X"
            className="text-[hsl(82,15%,62%)] transition-colors hover:text-[hsl(82,30%,80%)]"
          >
            <Twitter className="h-4 w-4" />
          </a>
          <a
            href={PORTFOLIO_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Portfolio"
            className="text-[hsl(82,15%,62%)] transition-colors hover:text-[hsl(82,30%,80%)]"
          >
            <Globe className="h-4 w-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}
