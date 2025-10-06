### RSVP tutorial (for React Native client developers)

This document explains how RSVP works in the backend so you can implement a smooth React Native UX for creating and joining events.

### Concepts
- **rsvpRequired (boolean)**: Set at event creation. Controls whether a guest must pick an RSVP status when joining.
- **RSVP status**: One of `yes | no | maybe`. Stored per participant in `event.participants`.

### Create event (organizer)
- Endpoint: `POST /events`
- Auth: Required (Bearer token)
- Body: multipart/form-data (poster upload required); include `rsvpRequired=true|false`.
- Behavior:
  - The `rsvpRequired` flag is saved on the event.
  - Other fields (title, description, dates, location, poster, etc.) are handled as per the existing API guides.

Client guidance:
- Include a toggle in the create form: “Require RSVP?” → maps to `rsvpRequired` boolean.
- Submit as part of the create request. No RSVP list is supplied at create-time; RSVP happens when guests join.

### Join event (guest)
Two ways to join:
1) Invite link
   - Endpoint: `POST /events/join/:inviteLink`
   - Auth: Required
   - Body (JSON): `{ status?: 'yes' | 'no' | 'maybe' }`

2) Public event by ID
   - Endpoint: `POST /events/:id/join`
   - Auth: Required
   - Body (JSON): `{ status?: 'yes' | 'no' | 'maybe' }`

Backend rules:
- If `rsvpRequired === true` on the event:
  - status is REQUIRED. Missing status → 400 error with message like “RSVP status is required to join this event”.
- If `rsvpRequired === false` on the event:
  - status is optional. If omitted, backend defaults to `yes`.
- Additional validations:
  - Event must exist and be `active`.
  - User must not already be a participant.
  - Capacity respected if `maxParticipants` is set.
  - Private vs. public: joining by ID only allowed for `isPublic` events; otherwise use invite link.

On success:
- The user is added to `event.participants` with `{ user, status, joinedAt }`.
- The event ID is added to `user.joinedEvents`.
- Caches are invalidated so subsequent fetches reflect updated data.

### Update RSVP (guest)
- Endpoint: `PATCH /events/:id/rsvp`
- Auth: Required
- Body: `{ status: 'yes' | 'no' | 'maybe' }`
- Rules:
  - Caller must already be a participant.
  - status must be one of the allowed values.
- Effect: Updates the caller’s `participants[].status` and invalidates caches.

### Leave event (guest)
- Endpoint: `DELETE /events/:id/rsvp`
- Auth: Required
- Rules:
  - Caller must be a participant.
- Effect: Removes the caller from `event.participants` and pulls the event from `user.joinedEvents`; caches invalidated.

### Fetch joined events (guest)
- Endpoint: `GET /events/joined-events`
- Returns events the user has joined with convenience fields:
  - `userParticipantStatus`: the current user’s RSVP (`yes|no|maybe`)
  - `userJoinedAt`: when the user joined

### React Native UX recommendations
- Create screen:
  - Add a toggle for “Require RSVP”. Bind to `rsvpRequired` in the create request.
  - Ensure validation for required fields is consistent with the API (location payload shape, poster required, etc.).

- Join screen (via invite or event detail for public):
  - If event.rsvpRequired is true → show a required selector (Yes/No/Maybe) and block join until selected.
  - If event.rsvpRequired is false → keep the selector optional or omit it; if omitted, backend will record `yes` by default.
  - Display server errors for capacity, already joined, inactive, or private joins appropriately.

- Event detail for participants:
  - Show current RSVP, allow changing it via `PATCH /events/:id/rsvp`.
  - Provide a “Leave event” button calling `DELETE /events/:id/rsvp`.

### Example requests
- Create with RSVP required:
```bash
POST /events
# multipart/form-data including poster
rsvpRequired=true
```

- Join (RSVP required):
```bash
POST /events/join/:inviteLink
Content-Type: application/json
{ "status": "maybe" }
```

- Join (RSVP not required):
```bash
POST /events/join/:inviteLink
# Body optional; if omitted, status defaults to "yes"
```

- Update RSVP:
```bash
PATCH /events/:id/rsvp
Content-Type: application/json
{ "status": "no" }
```

- Leave event:
```bash
DELETE /events/:id/rsvp
```

### Notes
- If you prefer stricter client behavior when `rsvpRequired === false`, you can omit the RSVP selector entirely and rely on the backend default `yes`.
- Error messages are returned in `{ status: 'fail', message: string }`. Use these to power inline form validation and toasts.


