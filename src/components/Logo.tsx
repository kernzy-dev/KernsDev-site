/** KernsDev logo — terminal-prompt mark (›_) + lowercase mono wordmark.
 *  Shared across the nav and the shop/fleetcast page headers. */

export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect x="2" y="2" width="60" height="60" rx="16" fill="#14141c" stroke="#a855f7" strokeWidth="2.5" />
      <path
        d="M22 22 L34 32 L22 42"
        fill="none"
        stroke="#a855f7"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="37" y="38" width="12" height="4.5" rx="2" fill="#a855f7" />
    </svg>
  );
}

export default function Logo({ href = "/" }: { href?: string }) {
  return (
    <a href={href} className="flex items-center gap-2.5 text-lg">
      <LogoMark />
      <span className="font-mono font-semibold tracking-tight">
        kerns<span className="text-accent">dev</span>
      </span>
    </a>
  );
}
