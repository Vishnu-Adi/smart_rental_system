# train_and_save.py
import csv, os
from pathlib import Path
from typing import Dict, Any
import cloudpickle as pickle  # or pickle/dill

from river import anomaly, preprocessing, compose

CSV_PATH   = r"AIML\MachineSensorData_anomalies.csv"
MODEL_PATH = Path("hst_quantile_model.pkl")

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

def build_model(q: float = 0.995):
    """Scaler -> HalfSpaceTrees -> QuantileFilter, all in one pipeline."""
    hst = anomaly.HalfSpaceTrees(n_trees=25, height=8, window_size=250, seed=42)
    # protect_anomaly_detector=False to match your current behavior (learn even on anomalies)
    qf = anomaly.QuantileFilter(hst, q=q, protect_anomaly_detector=False)
    model = compose.Pipeline(
        ("scale", preprocessing.MinMaxScaler()),
        ("filter", qf),
    )
    return model

def row_to_x(row: Dict[str, Any]) -> Dict[str, float]:
    x = {}
    for c in NUMERIC_COLS:
        v = row.get(c)
        if v not in (None, ""):
            try:
                x[c] = float(v)
            except Exception:
                pass
    return x

def train_and_save(csv_path: str = CSV_PATH, model_path: Path = MODEL_PATH):
    model = build_model(q=0.995)
    with open(csv_path, "r", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            x = row_to_x(row)
            if not x:
                continue
            # one pass: learn the scaler, filter's internal quantile, and HST
            model.learn_one(x)

    with open(model_path, "wb") as f:
        pickle.dump(model, f)

    print(f"Saved trained pipeline to {model_path.resolve()}")

if __name__ == "__main__":
    train_and_save()
