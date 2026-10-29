# Contact form storage and testing

Requires Node.js 18 or newer. No npm install required.

1. Open Terminal in this folder.
2. Run `node server.js` (or `npm start`).
3. Open `http://localhost:3000` in your browser (do not open the HTML as a file).
4. Submit the Contact form; saved submissions appear in `contact-submissions.json`.
5. Run `npm test` in a second Terminal window to check links, assets, buttons, form validation, API, and saved data. Tests use a temporary directory for storage, so they do not change your actual submissions.

The JSON file stores submitted contact information locally. Do not publish it or commit real submissions to a public repository.

Note: The original ZIP already references some image/video filenames that are not included in the archive. These existing missing media assets are reported during testing but are not replaced or changed.
