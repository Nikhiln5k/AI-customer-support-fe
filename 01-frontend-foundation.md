# NexusAI --- Frontend Requirements

## Part 1: Application Foundation, UX and Core Screens

### 1. Project Overview

**NexusAI** is a modern AI-assisted customer support and ticket
management platform.

Frontend stack:

-   Angular
-   TypeScript
-   Angular Router
-   RxJS
-   Angular Material or a small custom component layer
-   WebSocket client for real-time updates
-   REST API integration with the NestJS backend

The frontend must be responsive, production-oriented, readable, and
suitable for a portfolio/resume showcase.

### 2. Primary Frontend Goals

The application should demonstrate:

-   Professional Angular architecture
-   Reusable components
-   Reactive forms
-   Route guards and role-based UI
-   REST API integration
-   WebSocket-based real-time updates
-   AI-assisted workflows
-   Good loading/error/empty states
-   Mobile-responsive UX
-   Maintainable state and API handling

Do not build unnecessary marketing pages or a public-facing website. The
project is primarily an authenticated SaaS application.

### 3. Visual / UX Requirements

Use a modern minimalist B2B SaaS design.

Recommended visual direction:

-   Warm off-white/light neutral application background
-   Graphite/dark text
-   Emerald/teal primary action color
-   Amber for warnings
-   Red only for destructive/error states
-   Subtle borders
-   Moderate corner radius
-   Minimal shadows
-   Strong spacing and typography hierarchy

Avoid:

-   Excessive gradients
-   Neon colors
-   Oversized decorative headings
-   Excessive rounded pills
-   Large decorative illustrations
-   Dense tables without responsive alternatives

### 4. Application Layout

Desktop:

-   Collapsible left sidebar
-   Top bar
-   Main content area
-   Optional right contextual panel
-   Breadcrumbs on deep pages

Mobile:

-   Compact top bar
-   Bottom navigation for primary sections
-   Drawer for secondary navigation
-   Stacked cards instead of wide tables
-   Sticky primary actions
-   Touch-friendly controls

Primary navigation:

1.  Dashboard
2.  Tickets
3.  Customers
4.  Knowledge Base
5.  AI Workspace
6.  Notifications
7.  Reports
8.  Operations
9.  Team
10. Audit Logs
11. Settings

### 5. Authentication Screens

#### Login

Fields:

-   Email
-   Password
-   Remember me

Actions:

-   Sign in
-   Forgot password

States:

-   Loading
-   Invalid credentials
-   Network error

#### Forgot Password

Fields:

-   Email

Actions:

-   Send reset link
-   Return to login

#### Organization Setup

Fields:

-   Organization name
-   Admin name
-   Email
-   Password

The organization setup should be simple and not become a separate
multi-page onboarding system.

### 6. Dashboard

Display:

-   Open tickets
-   Overdue tickets
-   SLA health
-   Average response time
-   AI-assisted resolution rate
-   Agent workload

Sections:

-   Ticket trend
-   SLA status
-   Recent tickets
-   Recent activity

Requirements:

-   Date/filter controls
-   Loading skeletons
-   Empty states
-   API-driven values

### 7. Shared Listing UX

All major list pages should follow a consistent pattern.

Header:

-   Page title
-   Short description
-   Primary Create action

Toolbar:

-   Search
-   Filters
-   Active filter chips
-   Clear filters
-   Optional column visibility

List:

-   Useful columns only
-   Status badges
-   Row hover actions
-   Context menu
-   Checkbox selection where bulk actions make sense

Footer:

-   Result count
-   Pagination
-   Page size

Do not add bulk selection to screens where it provides little value.

### 8. Shared Form UX

Create/edit pages must use:

-   Clear section headings
-   Field labels
-   Required indicators
-   Helper text where useful
-   Inline validation
-   Disabled/loading submit state
-   Unsaved-change warning where appropriate
-   Sticky action footer on long forms

Desktop:

-   Two-column layout when appropriate

Mobile:

-   Single-column layout
-   Full-width fields
-   Sticky bottom action bar

Primary actions:

-   Save
-   Create
-   Update

Secondary:

-   Cancel

Destructive actions must require confirmation.

### 9. Error / Loading / Empty States

Every API-driven page must support:

-   Loading skeleton
-   Empty state
-   Error state
-   Retry action
-   Permission denied state

For WebSocket-dependent screens also support:

-   Connecting
-   Connected
-   Reconnecting
-   Disconnected

### 10. Accessibility and Quality

Minimum requirements:

-   Keyboard-friendly controls
-   Visible focus states
-   Accessible form labels
-   Sufficient contrast
-   Responsive layouts
-   No horizontal overflow on mobile
-   Consistent button sizes

Target touch controls:

-   Approximately 44--48px minimum interactive height on mobile.

### 11. Frontend Folder Direction

Suggested structure:

``` text
src/app/
  core/
    guards/
    interceptors/
    services/
    models/

  shared/
    components/
    directives/
    pipes/
    ui/

  features/
    auth/
    dashboard/
    tickets/
    customers/
    knowledge-base/
    ai/
    notifications/
    reports/
    operations/
    team/
    audit/
    settings/

  layout/
    shell/
    sidebar/
    topbar/

  app.routes.ts
```

Avoid creating a separate component for every tiny visual element. Reuse
components where there is real repetition.
