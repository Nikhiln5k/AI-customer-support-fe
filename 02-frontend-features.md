# NexusAI --- Frontend Requirements

## Part 2: Feature Modules, Real-Time UX and API Integration

## 1. Ticket Management

### Ticket List

Required:

-   Search
-   Status filter
-   Priority filter
-   Assignee filter
-   Date filter
-   Pagination
-   Sorting
-   Create ticket
-   Bulk status update where useful

Ticket columns:

-   Ticket ID
-   Subject
-   Customer
-   Priority
-   Status
-   Assignee
-   Updated time

### Create Ticket

Fields:

-   Customer
-   Subject
-   Description
-   Priority
-   Assignee
-   Tags

On submit:

1.  Validate form
2.  Send REST request
3.  Show progress
4.  Navigate to ticket detail
5.  Show success notification

### Edit Ticket

Allow updating:

-   Subject
-   Description
-   Priority
-   Status
-   Assignee
-   Tags

Use the same form components as creation where practical.

### Ticket Detail

Layout:

-   Conversation/timeline
-   Reply composer
-   Customer context
-   Ticket metadata
-   AI assistance panel

Actions:

-   Assign
-   Change status
-   Change priority
-   Add internal note
-   Reply
-   Attach file

## 2. Real-Time Conversation

Use WebSockets for:

-   New messages
-   Message delivery updates
-   Typing indicator
-   Agent/customer presence
-   Read state
-   Ticket activity updates

The UI must clearly show:

-   Sending
-   Sent
-   Failed
-   Reconnecting

Do not use WebSockets for ordinary CRUD operations that are better
handled by REST.

## 3. Customer Management

### Customer List

Required:

-   Search
-   Basic filters
-   Pagination
-   Create customer

Display:

-   Name
-   Email
-   Phone
-   Open tickets
-   Last interaction

### Customer Create/Edit

Fields:

-   Name
-   Email
-   Phone
-   Company
-   Notes

### Customer Profile

Show:

-   Contact details
-   Open tickets
-   Recent conversations
-   Activity timeline

## 4. AI Workspace

The AI interface should assist agents rather than automatically taking
control.

Actions:

-   Summarize ticket
-   Classify ticket
-   Detect sentiment
-   Suggest priority
-   Suggest reply
-   Extract action items

Each AI result should show:

-   Result
-   Confidence where available
-   Source/context where applicable
-   Loading state

For suggested replies:

1.  Generate
2.  Agent reviews
3.  Agent edits if required
4.  Agent explicitly sends

Never automatically send an AI-generated customer response.

## 5. Knowledge Base

### Knowledge List

Features:

-   Search
-   Category filter
-   Status filter
-   Pagination
-   Create article

### Create/Edit Article

Fields:

-   Title
-   Category
-   Content
-   Tags
-   Status

### Knowledge Detail

Show:

-   Article content
-   Metadata
-   Last updated
-   Edit action

### RAG Search

Allow users to ask a support question.

Display:

-   AI answer
-   Retrieved knowledge sources
-   Source titles
-   Relevant snippets

## 6. Notifications

Notification center should support:

-   Unread count
-   Read/unread state
-   Notification type
-   Timestamp
-   Mark as read
-   Mark all as read

WebSockets should update notifications in real time.

## 7. Reports

Show:

-   Ticket volume
-   Resolution time
-   Response time
-   SLA performance
-   Agent workload
-   AI-assisted resolution

Keep reporting focused on support operations. Avoid building a complex
BI system.

## 8. Operations

### BullMQ Monitor

Frontend should display:

-   Queue name
-   Waiting jobs
-   Active jobs
-   Completed jobs
-   Failed jobs
-   Delayed jobs

Job details:

-   Job ID
-   Job type
-   Status
-   Attempts
-   Created time
-   Completed/failed time
-   Error message

Allow safe operational actions such as:

-   Retry failed job
-   Remove failed job

Only authorized users should access this module.

### RabbitMQ Event Monitor

Display:

-   Event type
-   Exchange
-   Queue
-   Consumer
-   Status
-   Timestamp

This is primarily an observability screen, not a RabbitMQ administration
console.

## 9. Attachments

Support:

-   File selection
-   Upload progress
-   Upload success/failure
-   Preview where possible
-   Remove attachment

For AI processing:

-   Uploading
-   Processing
-   Completed
-   Failed

## 10. Team and Roles

### Users List

Display:

-   Name
-   Email
-   Role
-   Status
-   Last active

Actions:

-   Invite
-   Edit
-   Disable

### User Form

Fields:

-   Name
-   Email
-   Role
-   Status

### Roles

Support a small role model:

-   Admin
-   Agent
-   Viewer

Permission checks should be enforced by the backend; frontend
permissions are for UX only.

## 11. Audit Logs

Display:

-   Actor
-   Action
-   Resource
-   Timestamp
-   Result

Features:

-   Search
-   Date filter
-   Action filter
-   Detail view

## 12. Settings

Keep settings focused:

-   Profile
-   Organization
-   Notification preferences
-   AI configuration
-   Security/session information

Avoid unnecessary theme-builder and customization features.

## 13. API Integration

Use a centralized API layer.

Requirements:

-   HTTP interceptor
-   Authentication token handling
-   Standard error handling
-   Request loading states
-   Response typing
-   Environment configuration

API services should not contain UI logic.

## 14. State Management

Start with:

-   Angular services
-   RxJS
-   Signals where appropriate

Do not introduce NgRx solely for portfolio complexity.

Use centralized state only where shared state genuinely requires it.

## 15. Mobile Priority

The following workflows must receive dedicated responsive treatment:

-   Login
-   Dashboard
-   Ticket list
-   Ticket detail/chat
-   Create/edit ticket
-   Customer list/profile
-   AI workspace
-   Notifications

Mobile requirements:

-   Bottom navigation
-   Filter drawer
-   Stacked ticket cards
-   Full-width forms
-   Sticky actions
-   No horizontal scrolling
