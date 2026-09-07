# Admin Rwa Drawer Actions

Migrate legacy link-based management actions (Editar Proyecto, Fases, Bóveda Legal) into the new Drawer-style UI pattern to avoid full-page reloads and breaking the new administrative layout.

## Proposed Changes

### [AdminRwaView]
- Refactor the action buttons ("Editar Proyecto", etc.) to open the `PlatformInspectorDrawer` instead of navigating to `/admin/projects/[slug]/edit`.
- Add an `onClick` handler that fetches the complete project data from the API (`/api/admin/projects/[id]`) and injects it into the Drawer.

### [PlatformInspectorDrawer Context & Component]
- Extend `InspectorData` to accept an optional `customComponent: React.ReactNode` or a generic way to render complex UI (like `MultiStepForm`) instead of just `attributes` and `rawPayload`.
- If `customComponent` is present, render it filling the drawer body.

### [MultiStepForm integration]
- Import `MultiStepForm` dynamically (to avoid huge initial bundle size) or directly in the RWA View.
- Pass the fetched `project` data into the form.

## User Review Required
> [!IMPORTANT]
> The "Fases & Supply" and "Bóveda Legal" links point to pages that appear to not exist in the new codebase (`/phases` and `/documents`). Do we need to migrate these to Drawer components as well right now, or just the "Editar Proyecto" form? I can embed them if they exist somewhere else, or build the scaffolding for them.

## Verification Plan
1. Click "Editar Proyecto" on a deal in the RWA pipeline.
2. Verify that the drawer slides in containing the `MultiStepForm`.
3. Verify that the form works and we haven't lost context of the main view.
