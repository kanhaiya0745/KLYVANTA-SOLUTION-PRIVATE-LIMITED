# KLYVANTA SOLUTION PRIVATE LIMITED — Website

The project is split into separate frontend and backend folders. HTML contains page structure only, CSS contains styling, browser JavaScript contains UI interactions, and Node/Express contains the enquiry API.

## Project structure

```text
KLYVANTA-Professional-Structure/
├── frontend/
│   ├── index.html
│   ├── styles/
│   │   └── main.css
│   ├── scripts/
│   │   ├── app.js
│   │   └── service-galleries.js
│   └── assets/
│       ├── klyvanta-logo.png
│       └── director photographs
├── backend/
│   ├── server.js
│   └── data/
├── package.json
├── .env.example
└── .gitignore
```

## Run locally (recommended)

1. Install Node.js LTS.
2. Open this project root folder in VS Code (the folder containing `package.json`).
3. Open the VS Code terminal and run:

   ```bash
   npm install
   npm run dev
   ```

4. Open `http://localhost:5000` in your browser.
5. Test the enquiry form. The backend validates and stores enquiries in `backend/data/enquiries.jsonl`.

The form uses the backend API. Running only `frontend/index.html` with Live Server will not start the backend; use the commands above so the enquiry form can save submissions.

## Optional email notifications

The backend can also send an email notification to `klyvantasolutionpvtltd@gmail.com` when SMTP credentials are configured. Copy `.env.example` to `.env`, then fill in SMTP details from the mailbox/provider. Never commit `.env` or share its password.

## WhatsApp enquiry flow

After the enquiry is saved by the backend, the visitor can choose either company WhatsApp contact: 8076477680 or 9560404881. The visitor must press **Send** inside WhatsApp. A website cannot silently send WhatsApp messages on a visitor's behalf.

## Important deployment note

The JSONL enquiry file is suitable for local testing/small initial use, not a multi-instance production deployment. Before a high-traffic production launch, move enquiry storage to a managed database and configure HTTPS, backups, and production SMTP credentials.

Gallery images currently reference third-party illustrative images and are labelled as reference images, not KLYVANTA completed projects.


### Enquiry contact routing

WhatsApp enquiry choices are shown in this order: 8076477680 (primary), 9990965184, and 9560404881. Visitors choose a number and must press Send in WhatsApp; browsers cannot send messages silently. If the Express API is running, the enquiry is also saved locally before the WhatsApp choices open. If the API is unavailable (for example, when previewing with Live Server only), the form still opens the WhatsApp choices rather than failing.
