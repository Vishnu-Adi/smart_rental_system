import requests

payload = {
    "avg_fuel_consumption_rate": 3.2,
    "idle_fuel_consumption_pct": 12.5,
    "rpm_variance": 0.8
}
r = requests.post("http://localhost:8000/predict?learn=false", json=payload, timeout=10)
print(r.json())  # -> {"score": ..., "is_anomaly": 0 or 1}
