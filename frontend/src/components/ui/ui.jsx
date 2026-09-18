import { useEffect } from "react";
import { Tractor, X } from "lucide-react";

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

const PILL_STYLES = {
  present: 'bg-present-soft text-present',
  absent: 'bg-absent-soft text-absent',
  excused: 'bg-excused-soft text-excused',
  info: 'bg-info-soft text-info',
  neutral: 'bg-sunken text-ink-3',
};

const PILL_DOT = {
  present: 'bg-present',
  absent: 'bg-absent',
  excused: 'bg-excused',
  info: 'bg-info',
  neutral: 'bg-ink-3',
};

export function Pill({ status = 'neutral', children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-[11px] font-medium capitalize ${PILL_STYLES[status] || PILL_STYLES.neutral} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${PILL_DOT[status] || PILL_DOT.neutral}`} />
      {children}
    </span>
  );
}

export function Modal({ title, description, onClose, footer, children, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className={`relative w-full ${maxWidth} rounded-card border border-line bg-card shadow-lift`} role="dialog" aria-modal="true">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 text-ink-3 hover:text-ink">
          <X size={18} />
        </button>

        {(title || description) && (
          <div className="border-b border-line px-5 py-4 pr-10">
            {title && <h2 className="text-sm font-semibold text-ink">{title}</h2>}
            {description && <p className="mt-1 text-xs text-ink-2">{description}</p>}
          </div>
        )}

        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>

        {footer && <div className="flex items-center justify-end gap-3 border-t border-line px-5 py-4 bg-sunken">{footer}</div>}
      </div>
    </div>
  );
}

export function Avatar({ name, src, size = 32 }) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-field-soft font-semibold text-field"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {name?.[0]?.toUpperCase() || '?'}
    </span>
  );
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 px-6 py-14 text-center">
      {icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-sunken text-ink-3">
          {icon}
        </div>
      )}
      <h4 className="text-sm font-semibold text-ink">{title}</h4>
      {description && <p className="max-w-sm text-xs text-ink-3">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}