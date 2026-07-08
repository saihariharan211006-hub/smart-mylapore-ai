import sys
import os
import mimetypes

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

mimetypes.add_type("application/javascript", ".jsx")
mimetypes.add_type("application/javascript", ".tsx")
mimetypes.add_type("application/javascript", ".ts")

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

from backend.app.ml.predict import get_predictions, load_metrics_if_exists, SOURCE_DEST_MAP, WEATHER_MAP
from backend.app.database.db import save_prediction_record, save_feedback_record, get_prediction_history

app = FastAPI(
    title="Smart Mylapore AI Predictor API",
    description="Provides real-time AI-powered traffic prediction, route recommendations, and parking slot metrics for Mylapore.",
    version="2.0.0"
)

# CORS middleware for Next.js/Vite frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic schemas
class PredictionRequest(BaseModel):
    source: str = Field(..., example="Luz Corner")
    destination: str = Field(..., example="Kapaleeshwarar Temple")
    time: str = Field("08:00", example="08:00")
    day_of_week: int = Field(0, ge=0, le=6, description="0=Monday, 6=Sunday")
    weather: str = Field("sunny", example="sunny")
    festival: bool = Field(False)
    holiday: bool = Field(False)

class FeedbackRequest(BaseModel):
    prediction_id: int
    accuracy_rating: int = Field(..., ge=1, le=5)
    comments: Optional[str] = None

# Weather logic helper
def calculate_weather_stats(weather: str, hour: int) -> Dict[str, Any]:
    """Dynamically shapes temperatures and humidity profiles."""
    w = weather.lower().strip()
    
    # Base temp based on hour (Chennai averages)
    is_afternoon = 12 <= hour <= 15
    is_night = hour >= 20 or hour <= 5
    base_temp = 34 if is_afternoon else (27 if is_night else 30)
    
    if w == "cloudy":
        temp = base_temp - 2
        humidity = 70
        wind = 12
    elif w == "rainy":
        temp = base_temp - 5
        humidity = 85
        wind = 18
    elif w == "stormy":
        temp = base_temp - 7
        humidity = 95
        wind = 28
    else: # sunny
        temp = base_temp
        humidity = 55
        wind = 8
        
    return {
        "weather_condition": w.capitalize(),
        "temperature_celsius": temp,
        "humidity_percent": humidity,
        "wind_speed_kmh": wind
    }

@app.get("/api/weather")
async def get_weather(weather: str = "sunny", hour: int = 8):
    return calculate_weather_stats(weather, hour)

@app.get("/api/ml/metrics")
async def get_ml_metrics():
    return load_metrics_if_exists()

@app.post("/api/predict")
async def predict_traffic_and_parking(request: PredictionRequest):
    # Parse inputs to numerical codes
    # Map sources/destinations
    inv_source_dest = {v.lower(): k for k, v in SOURCE_DEST_MAP.items()}
    inv_weather = {v.lower(): k for k, v in WEATHER_MAP.items()}
    
    src_key = request.source.lower().strip()
    dest_key = request.destination.lower().strip()
    w_key = request.weather.lower().strip()
    
    # Fuzzy matching mapping fallbacks
    src_code = 0
    for name, code in inv_source_dest.items():
        if name in src_key or src_key in name:
            src_code = code
            break
            
    dest_code = 1
    for name, code in inv_source_dest.items():
        if name in dest_key or dest_key in name:
            dest_code = code
            break
            
    weather_code = inv_weather.get(w_key, 0)
    
    # Parse hour from time string
    try:
        hour = int(request.time.split(":")[0])
    except Exception:
        hour = 8
        
    # Execute Model predictions
    inf_results = get_predictions(
        hour=hour,
        day_of_week=request.day_of_week,
        weather=weather_code,
        festival=int(request.festival),
        holiday=int(request.holiday),
        source=src_code,
        destination=dest_code
    )
    
    # Calculate route options/recommendations
    predictions = inf_results["predictions"]
    parking = inf_results["parking"]
    
    # Determine best routing recommendation
    # (Drive vs Transit vs RideShare metrics comparison)
    drive_time = predictions["travel_time_minutes"]
    transit_time = drive_time + 12 if request.destination == "Luz Corner" else drive_time + 8
    if predictions["congestion_level"] == "Heavy":
        transit_time = max(15, drive_time - 5) # transit passes gridlock
        
    # SQL prediction log
    prediction_id = save_prediction_record(
        source=SOURCE_DEST_MAP.get(src_code, "Luz Corner"),
        destination=SOURCE_DEST_MAP.get(dest_code, "Kapaleeshwarar Temple"),
        hour=hour,
        day_of_week=request.day_of_week,
        weather=request.weather,
        festival=request.festival,
        holiday=request.holiday,
        congestion_level=predictions["congestion_level"],
        travel_time_minutes=predictions["travel_time_minutes"],
        average_speed_kmh=predictions["average_speed_kmh"],
        confidence_score=predictions["confidence_score"],
        parking_A_occupancy=parking["A"],
        parking_B_occupancy=parking["B"],
        parking_C_occupancy=parking["C"]
    )
    
    weather_stats = calculate_weather_stats(request.weather, hour)
    ml_comparison = load_metrics_if_exists()
    
    return {
        "prediction_id": prediction_id,
        "timestamp": datetime.utcnow().isoformat(),
        "input_summary": {
            "source": SOURCE_DEST_MAP.get(src_code),
            "destination": SOURCE_DEST_MAP.get(dest_code),
            "time": request.time,
            "weather": request.weather
        },
        "weather": weather_stats,
        "traffic": {
            "travel_time_minutes": predictions["travel_time_minutes"],
            "average_speed_kmh": predictions["average_speed_kmh"],
            "congestion_level": predictions["congestion_level"],
            "congestion_color": predictions["congestion_color"],
            "confidence_score": predictions["confidence_score"]
        },
        "routes": [
            {
                "type": "Drive & Park",
                "name": "R.K. Mutt Road Route",
                "time_minutes": predictions["travel_time_minutes"],
                "cost": 12.0 if request.holiday else 18.0,
                "score": 90 - (predictions["travel_time_minutes"] * 0.8)
            },
            {
                "type": "Public Transit",
                "name": "MTC Express Bus Route",
                "time_minutes": transit_time,
                "cost": 2.50,
                "score": 85 - (transit_time * 0.6) + (15 if predictions["congestion_level"] == "Heavy" else 0)
            },
            {
                "type": "Rideshare",
                "name": "Ola/Uber Auto or Car",
                "time_minutes": predictions["travel_time_minutes"] + 2,
                "cost": 45.0,
                "score": 95 - (predictions["travel_time_minutes"] * 0.7) - 15
            }
        ],
        "parking": [
            {
                "zone_id": "A",
                "name": "Temple East Gate Zone A",
                "occupancy_rate_percent": parking["A"],
                "total_slots": 120,
                "free_slots": round(120 * (1 - parking["A"]/100)),
                "distance_meters": 120,
                "walk_minutes": 2,
                "pricing": "$5.00/hr"
            },
            {
                "zone_id": "B",
                "name": "Luz Corner Zone B",
                "occupancy_rate_percent": parking["B"],
                "total_slots": 250,
                "free_slots": round(250 * (1 - parking["B"]/100)),
                "distance_meters": 450,
                "walk_minutes": 6,
                "pricing": "$3.00/hr"
            },
            {
                "zone_id": "C",
                "name": "Mada Street Area Zone C",
                "occupancy_rate_percent": parking["C"],
                "total_slots": 500,
                "free_slots": round(500 * (1 - parking["C"]/100)),
                "distance_meters": 950,
                "walk_minutes": 15,
                "pricing": "$1.00/hr"
            }
        ],
        "ml_accuracy_metrics": ml_comparison
    }

@app.post("/api/feedback")
async def log_feedback(request: FeedbackRequest):
    success = save_feedback_record(
        prediction_id=request.prediction_id,
        rating=request.accuracy_rating,
        comments=request.comments
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to record feedback inside the database."
        )
    return {"status": "success", "message": "Feedback recorded successfully"}

@app.get("/api/history")
async def get_history():
    records = get_prediction_history(limit=15)
    formatted = []
    for r in records:
        formatted.append({
            "id": r.id,
            "timestamp": r.timestamp.isoformat(),
            "source": r.source,
            "destination": r.destination,
            "hour": r.hour,
            "weather": r.weather,
            "congestion_level": r.congestion_level,
            "travel_time_minutes": r.travel_time_minutes,
            "parking_A_occupancy": r.parking_A_occupancy
        })
    return formatted

# Setup frontend static serving paths
import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend"))

# Mount frontend directory
app.mount("/static", StaticFiles(directory=frontend_dir), name="static")

@app.get("/")
async def serve_index():
    return FileResponse(os.path.join(frontend_dir, "index.html"))

