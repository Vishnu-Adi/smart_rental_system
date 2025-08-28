# train_knn_save.py
import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import NearestNeighbors
import joblib  # pip install joblib

# ---------- CONFIG ----------
CSV_PATH = Path(r"AIML\company_cluster_features.csv")
ARTIFACT_PATH = Path("knn_recommender.joblib")

FEATURE_COLS = ["avg_util", "peak_util_p95", "fleet_now", "stress_index"]
ID_COL = "company_id"
# (optional) carry these through for debugging/inspection when responding
EXTRA_COLS = [c for c in ["industry", "state"] if c]  # keep if present
# ----------------------------

def main():
    df = pd.read_csv(CSV_PATH)

    missing = [c for c in [ID_COL, *FEATURE_COLS] if c not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns in CSV: {missing}")

    # Drop rows with missing features
    df = df.dropna(subset=FEATURE_COLS).reset_index(drop=True)

    # Fit scaler and KNN on features
    X = df[FEATURE_COLS].to_numpy(dtype=float)
    scaler = StandardScaler()
    Xs = scaler.fit_transform(X)

    nn = NearestNeighbors(metric="euclidean")
    nn.fit(Xs)

    # Save artifact: everything needed for inference
    artifact = {
        "scaler": scaler,
        "nn": nn,
        "feature_cols": FEATURE_COLS,
        "id_col": ID_COL,
        # Keep only useful columns for inference/response
        "df": df[[ID_COL, *FEATURE_COLS, *[c for c in EXTRA_COLS if c in df.columns]
                 ] + [c for c in df.columns if c.startswith("avg_") or c.startswith("total_") or c.endswith("_count")]].copy()
        # ^ adjust the asset column heuristic if you want
    }
    joblib.dump(artifact, ARTIFACT_PATH, compress=3)
    print(f"Saved artifact to {ARTIFACT_PATH.resolve()} with {len(df)} rows.")

if __name__ == "__main__":
    main()
