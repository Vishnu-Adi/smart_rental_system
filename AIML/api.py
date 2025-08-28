# api.py
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, Depends, Request
from pydantic import BaseModel
from typing import Optional
import cloudpickle as pickle

from inference import load_model, predict_one, MODEL_PATH

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.model = load_model(MODEL_PATH)
    yield

app = FastAPI(lifespan=lifespan)

class Event(BaseModel):
    avg_fuel_consumption_rate: Optional[float] = None
    idle_fuel_consumption_pct: Optional[float] = None
    rpm_variance: Optional[float] = None
    coolant_temp_anomalies: Optional[float] = None
    productive_time_mins: Optional[float] = None
    idle_time_mins: Optional[float] = None
    vibration_anomalies: Optional[float] = None
    over_speed_events: Optional[float] = None
    tire_pressure_deviations: Optional[float] = None
    error_code_frequency: Optional[float] = None
    battery_low_voltage_events: Optional[float] = None

def get_model(request: Request):
    return request.app.state.model

def save_model(model, path: Path = MODEL_PATH):
    with open(path, "wb") as f:
        pickle.dump(model, f)

@app.post("/predict")
def predict(e: Event, learn: bool = False, model = Depends(get_model)):
    # pydantic v2 vs v1 compatibility:
    data = e.model_dump(exclude_none=True) if hasattr(e, "model_dump") else e.dict(exclude_none=True)
    result = predict_one(data, model, learn=learn)
    if learn:
        save_model(model)
    return result
