# JSON submission API integration

This route module implements the four JSON-file endpoints for the Random Adventure project.

## 1. Install Express

From the project folder:

```bash
npm install express
```

## 2. Mount the routes in the Express server

In `server.js`, after creating the Express app:

```javascript
const express = require("express");
const createSubmissionRouter = require("./routes/submissionRoutes");

const app = express();

app.use(express.json());
app.use("/api", createSubmissionRouter());
```

Keep your existing static-file setup and server startup. Do not create a second server or a second `app` variable.

## 3. Endpoints

| Method | URL | Purpose |
|---|---|---|
| POST | `/api/contact` | Save a contact form submission |
| GET | `/api/contact` | Fetch saved contact submissions |
| POST | `/api/suggestions` | Save an adventure suggestion |
| GET | `/api/suggestions` | Fetch saved suggestions |

The module stores data in `contact-submissions.json` and `suggestions.json` in the project root.

## 4. Test with Postman

### POST contact

URL: `http://localhost:3000/api/contact`

Body -> raw -> JSON:

```json
{
  "name": "Aarav",
  "email": "aarav@example.com",
  "subject": "Feedback",
  "message": "I would like to suggest a new activity."
}
```

Expected status: `201 Created`.

### GET contact

URL: `http://localhost:3000/api/contact`

Expected: a JSON array of saved contact submissions.

### POST suggestion

URL: `http://localhost:3000/api/suggestions`

Body -> raw -> JSON:

```json
{
  "activity": "Board Game Evening",
  "category": "Social",
  "description": "Invite friends for an evening of board games.",
  "duration": "2 hours",
  "budget": "Under $20"
}
```

Expected status: `201 Created`.

### GET suggestions

URL: `http://localhost:3000/api/suggestions`

Expected: a JSON array of saved suggestions.

To test validation, send an invalid email to the contact endpoint or an unsupported category to the suggestion endpoint. Expected status: `400 Bad Request`.

## Important

- The current frontend already sends POST requests to these same URLs.
- `suggestions_server.py` is a separate Python server; these Express routes replace its backend role. Do not run both servers for the same feature.
- The route module does not start a server by itself. It must be mounted in the group's Express `server.js`.
- Contact records contain personal information. Do not commit real submissions to a public GitHub repository.
