"""
Streaming anomaly detection with River's Half-Space Trees (online, unsupervised).
- pip install -U river
"""

import csv
from pathlib import Path
from collections import deque
from typing import Dict, Any
import numpy as np

from river import anomaly, preprocessing

# Windows-safe path; adjust if needed
CSV_PATH = r"AIML\MachineSensorData_anomalies.csv"
TIME_COL = "timestamp"
ID_COL = "machine_id"

NUMERIC_COLS = [
    "avg_fuel_consumption_rate",
    "idle_fuel_consumption_pct",
    "rpm_variance",
    "coolant_temp_anomalies",
    "productive_time_mins",
    "idle_time_mins",
    "vibration_anomalies",
    "over_speed_events",
    "tire_pressure_deviations",
    "error_code_frequency",
    "battery_low_voltage_events",
]

def main():
    # Build components (no pipeline, no operator overloading)
    mm = preprocessing.MinMaxScaler()
    hst = anomaly.HalfSpaceTrees(n_trees=25, height=8, window_size=250, seed=42)

    # Sanity checks
    assert hasattr(mm, "transform_one") and hasattr(mm, "learn_one")
    assert hasattr(hst, "score_one") and hasattr(hst, "learn_one")

    buffer = deque(maxlen=1000)
    q = 0.995  # 99.5th percentile threshold

    out_path = Path("stream_scores.csv")
    with open(CSV_PATH, "r", newline="", encoding="utf-8") as f_in, open(out_path, "w", newline="", encoding="utf-8") as f_out:
        reader = csv.DictReader(f_in)
        writer = csv.DictWriter(f_out, fieldnames=["timestamp", "machine_id", "score", "is_anomaly"])
        writer.writeheader()

        for row in reader:
            # Build numeric feature dict
            x: Dict[str, Any] = {}
            for c in NUMERIC_COLS:
                v = row.get(c)
                if v is None or v == "":
                    continue
                try:    
                    x[c] = float(v)
                except Exception:
                    pass
            if not x:
                continue

            # ---- SCORE then LEARN (no reassignments) ----
            xs = mm.transform_one(x)            # scale using current stats
            score = hst.score_one(xs)           # higher = more anomalous
            buffer.append(score)

            mm.learn_one(x)                     # mutate in place; do NOT reassign
            hst.learn_one(xs)                   # mutate in place; do NOT reassign

            thr = float(np.quantile(buffer, q)) if len(buffer) > 100 else float("inf")
            is_anom = int(score >= thr)

            t = row.get(TIME_COL, "") or ""
            m = row.get(ID_COL, "") or ""
            writer.writerow({"timestamp": t, "machine_id": m, "score": score, "is_anomaly": is_anom})

    print(f"Wrote streaming scores to {out_path.resolve()}")

if __name__ == "__main__":
    main()
