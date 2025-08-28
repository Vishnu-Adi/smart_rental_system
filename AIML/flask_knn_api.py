# flask_knn_api.py
from flask import Flask, request, jsonify
from pathlib import Path
import numpy as np
import joblib

ARTIFACT_PATH = Path("knn_recommender.joblib")

app = Flask(__name__)
artifact = joblib.load(ARTIFACT_PATH)  # load once

scaler = artifact["scaler"]
nn = artifact["nn"]
FEATURE_COLS = artifact["feature_cols"]
ID_COL = artifact["id_col"]
df = artifact["df"]  # pandas DataFrame

def resolve_asset_col(asset: str, df) -> str:
    a = (asset or "").strip().lower()
    # exact match
    if a in df.columns:
        return a
    # prefer avg_ prefix
    if f"avg_{a}" in df.columns:
        return f"avg_{a}"
    # simple plural/singular toggles
    variants = []
    if a.endswith("s"):
        variants.append(a[:-1])
    else:
        variants.append(a + "s")
    for v in variants:
        if v in df.columns:
            return v
        if f"avg_{v}" in df.columns:
            return f"avg_{v}"
    raise ValueError(
        f"Asset '{asset}' not found. Tried '{a}' and 'avg_{a}'. "
        f"Available examples: {[c for c in df.columns if c.startswith('avg_')][:8]}"
    )

def recommend(company_id, asset, current_rented, k=5):
    asset_col = resolve_asset_col(asset, df)
    if asset_col not in df.columns:
        raise ValueError(f"asset '{asset_col}' not found in data.")

    # find the row for this company_id
    matches = df.index[df[ID_COL].astype(str) == str(company_id)].tolist()
    if not matches:
        raise ValueError(f"{ID_COL} {company_id} not found.")
    idx = matches[0]

    # build the standardized vector for this company and query KNN
    x = df.loc[idx, FEATURE_COLS].to_numpy(dtype=float)[None, :]
    xs = scaler.transform(x)

    # ask for k+1 because the closest neighbor will be the company itself
    n_req = min(k + 1, len(df))
    dists, inds = nn.kneighbors(xs, n_neighbors=n_req, return_distance=True)

    dists = dists[0].tolist()
    inds = inds[0].tolist()

    # remove self and keep k
    pairs = [(d, i) for d, i in zip(dists, inds) if i != idx][:k]
    if not pairs:
        raise ValueError("No neighbours found (dataset too small).")

    neigh_idx = [i for _, i in pairs]
    neigh = df.iloc[neigh_idx].copy()
    neigh["distance"] = [d for d, _ in pairs]

    # compute cluster mean for the requested asset
    cluster_mean = float(neigh[asset_col].dropna().mean())
    if np.isnan(cluster_mean):
        raise ValueError(f"No valid values for asset '{asset_col}' among neighbours.")

    diff = cluster_mean - float(current_rented)
    rec = int(np.floor(diff + 0.5)) if diff > 0 else 0
    
    return max(rec, 0)

@app.post("/recommend")
def recommend_endpoint():
    try:
        data = request.get_json(force=True) or {}
        company_id = data["company_id"]
        asset = data["asset"]
        current_rented = float(data["current_rented"])
        k = int(data.get("k", 5))
        out = recommend(company_id, asset, current_rented, k=k)
        return jsonify(out)
    except KeyError as e:
        return jsonify({"error": f"Missing required field: {e}"}), 400
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"Internal error: {e}"}), 500

if __name__ == "__main__":
    # Dev server (for production use gunicorn/uwsgi)
    app.run(host="0.0.0.0", port=8000, debug=True)
