import { Tractor } from "lucide-react";

export function Field({ label, required, hint, error, children }) {
  return (
    <div className="field">
      {label && <label>{label} {required && <span className="req">*</span>}</label>}
      {children}
      {error ? <p className="err-text">{error}</p> : hint ? <p className="hint">{hint}</p> : null}
    </div>
  );
}

export function TractorLoader({ size = 44, className = "" }) {
  return (
    <div className={`relative h-16 flex items-end justify-center overflow-hidden ${className}`}>
      <span
        className="tractor-loader-dust absolute left-1/2 bottom-2 w-2 h-2 rounded-full"
        style={{ animationDelay: "0s" }}
      />
      <span
        className="tractor-loader-dust absolute left-1/2 bottom-2 w-1.5 h-1.5 rounded-full"
        style={{ animationDelay: "0.35s" }}
      />
      <span
        className="tractor-loader-dust absolute left-1/2 bottom-2 w-1 h-1 rounded-full"
        style={{ animationDelay: "0.7s" }}
      />
      <Tractor
        size={size}
        strokeWidth={1.75}
        className="tractor-loader-icon relative z-10"
      />
    </div>
  );
}

export function PageLoader({ title, subtitle }) {
  return (
    <main className="w-full min-h-screen flex items-center justify-center p-4">
      <div className="rounded-card  p-10 max-w-md w-full text-center">
        <TractorLoader className="mb-1" />

        <div className="tractor-loader-road w-32 mx-auto mb-6" />

        <h1
          className="text-lg font-bold mb-1.5"
          style={{ color: "var(--olive-ink)" }}
        >
          {title || ""}
        </h1>
        {subtitle && <p className="text-sm text-ink-2">{subtitle}</p>}
      </div>
    </main>
  );
}

export function Button({ variant = 'primary', size = 'md', className = '', children, ...rest }) {
  const cls = ['btn', `btn-${variant}`, size === 'sm' ? 'btn-sm' : '', className].filter(Boolean).join(' ');
  return <button className={cls} {...rest}>{children}</button>;
}