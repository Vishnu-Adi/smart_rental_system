from flask import Flask, request, jsonify
from pathlib import Path
import cloudpickle as pickle

from inference import load_model, predict_one, MODEL_PATH  # reuse your utils

app = Flask(__name__)
model = load_model(MODEL_PATH)  # load once at import

def save_model(m, path: Path = MODEL_PATH):
    with open(path, "wb") as f:
        pickle.dump(m, f)

@app.post("/predict")
def predict():
    data = request.get_json(force=True) or {}
    learn = (request.args.get("learn", "false").lower() == "true")
    result = predict_one(data, model, learn=learn)
    if learn:
        save_model(model)
    return jsonify(result)

if __name__ == "__main__":
    # Run the Flask dev server
    # For production, prefer gunicorn/uvicorn behind a reverse proxy.
    app.run(host="0.0.0.0", port=8000, debug=True)
