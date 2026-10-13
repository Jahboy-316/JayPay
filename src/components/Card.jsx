export function Card({ children, className = "", ...props }) {
  return (
    <div
      className={`bg-[var(--surface)] border border-[var(--border)] squircle-card p-4 md:p-6 transition-colors ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className = "" }) {
  return (
    <div className={`flex items-start justify-between gap-4 mb-4 ${className}`}>
      <div>
        {title && <h2 className="text-lg font-medium text-[var(--text)] tracking-[-0.01em]">{title}</h2>}
        {subtitle && <p className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
