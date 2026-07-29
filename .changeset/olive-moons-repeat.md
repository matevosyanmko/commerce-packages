---
"@gucco/ui": patch
---

Move `sonner` and `lucide-react` to peer dependencies. `@gucco/ui` ships the `<Toaster>`
wrapper while `@gucco/commerce-ui` calls `toast()` through a peer, so a regular dependency
here could resolve to a second copy of sonner — the Toaster mounts in one instance, the
toasts fire into the other, and nothing appears.
