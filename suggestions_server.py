import json
import os
import tempfile
import threading
from datetime import datetime, timezone
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parent
SUGGESTIONS_FILE = ROOT / "suggestions.json"
MAX_REQUEST_SIZE = 16 * 1024
ALLOWED_CATEGORIES = {
    "Outdoors",
    "Creative",
    "Food",
    "Relaxation",
    "Social",
    "Other",
}
ALLOWED_BUDGETS = {"", "Free", "Under $20", "$20-$50", "Over $50"}
file_lock = threading.Lock()


class SuggestionRequestHandler(SimpleHTTPRequestHandler):
    def do_POST(self):
        if urlsplit(self.path).path != "/api/suggestions":
            self.send_json(404, {"error": "Endpoint not found."})
            return

        if self.headers.get_content_type() != "application/json":
            self.send_json(415, {"error": "Send the suggestion as JSON."})
            return

        try:
            content_length = int(self.headers.get("Content-Length", ""))
        except ValueError:
            self.send_json(400, {"error": "A valid Content-Length is required."})
            return

        if content_length < 1 or content_length > MAX_REQUEST_SIZE:
            self.send_json(413, {"error": "The suggestion request is too large."})
            return

        try:
            payload = json.loads(self.rfile.read(content_length).decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            self.send_json(400, {"error": "The suggestion must be valid JSON."})
            return

        error = validate_suggestion(payload)
        if error:
            self.send_json(400, {"error": error})
            return

        suggestion = {
            "activity": payload["activity"].strip(),
            "category": payload["category"],
            "description": payload["description"].strip(),
            "duration": payload["duration"].strip(),
            "budget": payload["budget"],
            "createdAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        }

        try:
            save_suggestion(suggestion)
        except (OSError, json.JSONDecodeError, ValueError) as error:
            self.log_error("Could not save suggestion: %s", error)
            self.send_json(500, {"error": "The suggestion could not be saved. Please try again."})
            return

        self.send_json(201, {"message": "Suggestion saved."})

    def send_json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(body)


def validate_suggestion(payload):
    if not isinstance(payload, dict):
        return "The suggestion must be an object."

    activity = payload.get("activity")
    category = payload.get("category")
    description = payload.get("description")
    duration = payload.get("duration", "")
    budget = payload.get("budget", "")

    if not isinstance(activity, str) or not 1 <= len(activity.strip()) <= 80:
        return "Activity name must be between 1 and 80 characters."
    if not isinstance(category, str) or category not in ALLOWED_CATEGORIES:
        return "Choose a valid category."
    if not isinstance(description, str) or not 1 <= len(description.strip()) <= 500:
        return "Description must be between 1 and 500 characters."
    if not isinstance(duration, str) or len(duration.strip()) > 40:
        return "Time needed must be 40 characters or fewer."
    if not isinstance(budget, str) or budget not in ALLOWED_BUDGETS:
        return "Choose a valid budget."

    return ""


def save_suggestion(suggestion):
    with file_lock:
        suggestions = json.loads(SUGGESTIONS_FILE.read_text(encoding="utf-8"))
        if not isinstance(suggestions, list):
            raise ValueError("suggestions.json must contain a JSON array")

        suggestions.append(suggestion)
        temporary_path = None
        try:
            with tempfile.NamedTemporaryFile(
                mode="w",
                encoding="utf-8",
                dir=ROOT,
                prefix=".suggestions-",
                suffix=".tmp",
                delete=False,
            ) as temporary_file:
                temporary_path = Path(temporary_file.name)
                json.dump(suggestions, temporary_file, indent=2, ensure_ascii=False)
                temporary_file.write("\n")
            os.replace(temporary_path, SUGGESTIONS_FILE)
        finally:
            if temporary_path is not None and temporary_path.exists():
                temporary_path.unlink()


def main():
    handler = partial(SuggestionRequestHandler, directory=str(ROOT))
    server = ThreadingHTTPServer(("127.0.0.1", 8000), handler)
    print("Serving Random Adventure at http://127.0.0.1:8000/")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping suggestion server.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
