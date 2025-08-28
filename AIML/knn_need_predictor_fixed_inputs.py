import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import NearestNeighbors

# Paths and fixed inputs
csv_path = Path("company_cluster_features.csv")
company_id = 1
asset_col = "avg_cranes"   # for 'crane'
current_rented = 1
k = 5

# Load
df = pd.read_csv(csv_path)

# Basic checks
need_cols = ["company_id", "avg_util", "peak_util_p95", "fleet_now", "stress_index", asset_col]
missing = [c for c in need_cols if c not in df.columns]
if missing:
    raise ValueError(f"Missing required columns in CSV: {missing}")

# Drop NaNs in features
df = df.dropna(subset=["avg_util", "peak_util_p95", "fleet_now", "stress_index"]).reset_index(drop=True)

# Locate target row
matches = df.index[df["company_id"].astype(str) == str(company_id)].tolist()
if not matches:
    raise ValueError(f"company_id {company_id} not found in file.")
idx = matches[0]

# Build feature matrix
X = df[["avg_util", "peak_util_p95", "fleet_now", "stress_index"]].to_numpy(dtype=float)

# Standardize and run KNN (euclidean distance on standardized space)
scaler = StandardScaler()
Xs = scaler.fit_transform(X)

nn = NearestNeighbors(n_neighbors=min(k+1, len(df)), metric="euclidean")
nn.fit(Xs)
dists, inds = nn.kneighbors(Xs[idx:idx+1], return_distance=True)

# Remove self if present and keep k neighbours
dists = dists[0].tolist()
inds = inds[0].tolist()
pairs = [(d, i) for d, i in zip(dists, inds) if i != idx][:k]

if not pairs:
    raise ValueError("No neighbours found (dataset too small).")

neigh_idx = [i for _, i in pairs]
neigh = df.iloc[neigh_idx]

# Compute cluster mean for the asset column
cluster_mean = float(neigh[asset_col].mean())
diff = cluster_mean - float(current_rented)
rec = int(np.floor(diff + 0.5)) if diff > 0 else 0
if rec < 0:
    rec = 0

# Print just the required result
print(rec)

# Also save a tiny log to file for transparency (optional)
with open("/mnt/data/knn_simple_output.txt", "w") as f:
    f.write(str(rec))