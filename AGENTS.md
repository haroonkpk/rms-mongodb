<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.


<!-- END:nextjs-agent-rules -->

# Project Rules

<!-- BEGIN:ui-rules --> 
# UI Rules

* Use `clamp()` for responsive spacing, sizing, and border-radius where appropriate.
* Prefer fluid responsive values over unnecessary fixed values.
* Always reuse existing UI components; never duplicate them.
* Reuse existing Input, Select, Modal, Button, Card, Chart, DataTable, and Textarea components.
* Always reuse existing Activity Filters, Activity Data Table, Activity Detail Modal, and Print PDF Button.
* Follow the existing design system and UI patterns.
* Before creating anything new, check for an existing reusable component.
* Keep UI consistent across the entire project.



## Global Colors

* Use only the colors defined in global CSS `:root`.
* Always use the existing CSS variables; never hard-code colors.
* Do not create new colors or variables unless explicitly requested.
* Apply the same color system consistently across the entire project.

<!-- END:ui-rules -->

<!-- BEGIN:backend-rules -->
## Backend API

* Use Next.js Server Actions for backend operations and data mutations.
* Prefer Server Actions over creating API routes when possible.
* Keep Server Actions secure, validated, and server-only.

<!-- END:backend-rules -->

