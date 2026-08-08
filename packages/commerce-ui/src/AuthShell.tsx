import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { Label } from "@wm-storefront/ui/label";

// Shared centered card used by the sign-in and register pages, so the two
// screens stay visually consistent.
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="container-page py-16 md:py-24">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
          {subtitle && <p className="mt-3 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {children}
        {footer && <p className="mt-8 text-center text-sm text-muted-foreground">{footer}</p>}
      </div>
    </div>
  );
}

// Labelled form field with accessible error wiring, mirroring the checkout form.
export function AuthField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  const id = `auth-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const errorId = error ? `${id}-error` : undefined;
  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": errorId,
      })
    : children;
  return (
    <div>
      <Label
        htmlFor={id}
        className="mb-1.5 block text-xs uppercase tracking-widest text-muted-foreground"
      >
        {label}
      </Label>
      {control}
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
