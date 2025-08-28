# inference.py
from typing import Dict, Any
from pathlib import Path
import cloudpickle as pickle  # or pickle/dill

MODEL_PATH = Path("/Users/vishnuadithya/Documents/Projects/caterpillars/smart_rental_system/hst_quantile_model.pkl")

# Reuse NUMERIC_COLS and row_to_x from training if you share a utils module
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

def row_to_x(event: Dict[str, Any]) -> Dict[str, float]:
    x = {}
    for c in NUMERIC_COLS:
        v = event.get(c)
        if v not in (None, ""):
            try:
                x[c] = float(v)
            except Exception:
                pass
    return x

def load_model(model_path: Path = MODEL_PATH):
    with open(model_path, "rb") as f:
        return pickle.load(f)

def predict_one(event: Dict[str, Any], model, learn: bool = False) -> Dict[str, Any]:
    """
    event: dict with numeric fields
    model: the loaded river Pipeline
    learn: if True, keep adapting model after predicting
    """
    x = row_to_x(event)
    if not x:
        raise ValueError("No numeric features present in event.")

    # score using scaler->HST, then classify via QuantileFilter
    score = model.score_one(x)              # high = more anomalous
    is_anom = int(model["filter"].classify(score))  # 0/1

    if learn:
        model.learn_one(x)  # updates scaler, HST, and the quantile threshold

    return {"score": float(score), "is_anomaly": is_anom}
