import os
from flask import Flask, jsonify

app = Flask(__name__)

def auth_enabled():
    return os.environ.get("AUTH_SERVICE_ENABLED", "false").lower() == "true"

@app.route("/health")
def health():
    return jsonify(status="ok"), 200

@app.route("/login", methods=["POST"])
def login():
    if not auth_enabled():
        return jsonify(error="auth service disabled"), 503
    return jsonify(token="fake-jwt-token-123"), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)