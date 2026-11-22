# MongoDB setup, contact form storage, and testing

Requires Node.js 18 or newer and MongoDB Community Server running locally, or a MongoDB Atlas connection string.

1. Open Terminal in the project folder and install dependencies with `npm install`.
2. Start your local MongoDB service, or create a MongoDB Atlas database.
3. Copy `.env.example` to `.env`. Set `MONGODB_URI` to your connection string. For a local MongoDB server, the example URI is ready to use:

   ```env
   MONGODB_URI=mongodb://127.0.0.1:27017/random_adventure
   PORT=3000
   ```

   For Atlas, replace the local URI with your Atlas connection string and keep credentials in `.env`; do not commit that file.
4. Run `npm start`. The server connects to MongoDB, creates the `adventures` collection if needed, and then listens on the configured port.
5. Open `http://localhost:3000` in your browser (do not open the HTML as a file). The MongoDB-backed endpoint is `GET http://localhost:3000/api/adventures`.
6. Run `npm test` to check the adventure schema and existing website/API functionality. Tests use a temporary directory for contact submissions.

To import the records from `adventures.json` into MongoDB, stop the server if it is running and run `npm run import:data`. The import matches records by adventure name and only inserts names not already in the collection; it does not replace or delete existing records. You can run it again safely.

If `MONGODB_URI` is missing, the server still starts so the existing site and JSON-backed contact/suggestion APIs remain usable, but `/api/adventures` returns `503`. If a configured MongoDB connection fails at startup, the error is printed and the server does not start.

Contact submissions and adventure suggestions continue to be stored locally in JSON files. Do not publish real submissions or commit them to a public repository.

Note: The original project references some image/video filenames that are not included in the project. These existing missing media assets are reported during testing but are not replaced or changed.
