
"""
Batch baseline with IsolationForest (unsupervised).
- pip install scikit-learn pandas numpy
- Fit on earlier data, score later data. Can be rerun periodically in production.
"""
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

CSV_PATH = "AIML\MachineSensorData_anomalies.csv"
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
    df = pd.read_csv(CSV_PATH)
    if TIME_COL in df.columns:
        df[TIME_COL] = pd.to_datetime(df[TIME_COL], errors="coerce")
        df = df.sort_values([TIME_COL, ID_COL] if ID_COL in df.columns else [TIME_COL])

    n = len(df)
    train_df = df.iloc[: int(0.7*n)]
    test_df  = df.iloc[int(0.7*n):]

    scaler = StandardScaler()
    X_train = scaler.fit_transform(train_df[NUMERIC_COLS].values)
    X_test  = scaler.transform(test_df[NUMERIC_COLS].values)

    clf = IsolationForest(n_estimators=200, contamination=0.01, random_state=42)
    clf.fit(X_train)
    # score_samples: higher means more normal; we invert to make 'higher = more anomalous'
    scores = -clf.score_samples(X_test)
    preds = (clf.predict(X_test) == -1).astype(int)

    out = test_df.copy()
    out["anomaly_score"] = scores
    out["is_anomaly"] = preds
    out_path = Path("iforest_batch_scores.csv")
    out.to_csv(out_path, index=False)
    print(f"Saved batch IF scores to {out_path.resolve()}")

if __name__ == "__main__":
    main()
