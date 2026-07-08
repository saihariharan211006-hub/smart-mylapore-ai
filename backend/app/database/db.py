import os
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL")

# Fallback to local SQLite if DATABASE_URL is not set
if not DATABASE_URL:
    if os.getenv("VERCEL") == "1":
        DATABASE_URL = "sqlite:////tmp/mylapore_smart.db"
    else:
        DATABASE_URL = "sqlite:///./mylapore_smart.db"

# Workaround for Render/Supabase postgresql protocol
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database Tables Definition
class Prediction(Base):
    __tablename__ = "predictions"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    source = Column(String, index=True)
    destination = Column(String, index=True)
    hour = Column(Integer)
    day_of_week = Column(Integer)
    weather = Column(String)
    festival = Column(Boolean, default=False)
    holiday = Column(Boolean, default=False)
    
    # Traffic Predictions
    congestion_level = Column(String)
    travel_time_minutes = Column(Integer)
    average_speed_kmh = Column(Integer)
    confidence_score = Column(Float)
    
    # Parking Predictions
    parking_A_occupancy = Column(Integer)
    parking_B_occupancy = Column(Integer)
    parking_C_occupancy = Column(Integer)

class Feedback(Base):
    __tablename__ = "feedback"
    
    id = Column(Integer, primary_key=True, index=True)
    prediction_id = Column(Integer, ForeignKey("predictions.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    accuracy_rating = Column(Integer) # 1 to 5 stars
    comments = Column(String, nullable=True)

# Auto-provision tables on module load
Base.metadata.create_all(bind=engine)

def save_prediction_record(
    source: str,
    destination: str,
    hour: int,
    day_of_week: int,
    weather: str,
    festival: bool,
    holiday: bool,
    congestion_level: str,
    travel_time_minutes: int,
    average_speed_kmh: int,
    confidence_score: float,
    parking_A_occupancy: int,
    parking_B_occupancy: int,
    parking_C_occupancy: int
) -> int:
    """Saves a prediction record and returns its ID."""
    db = SessionLocal()
    try:
        db_prediction = Prediction(
            source=source,
            destination=destination,
            hour=hour,
            day_of_week=day_of_week,
            weather=weather,
            festival=festival,
            holiday=holiday,
            congestion_level=congestion_level,
            travel_time_minutes=travel_time_minutes,
            average_speed_kmh=average_speed_kmh,
            confidence_score=confidence_score,
            parking_A_occupancy=parking_A_occupancy,
            parking_B_occupancy=parking_B_occupancy,
            parking_C_occupancy=parking_C_occupancy
        )
        db.add(db_prediction)
        db.commit()
        db.refresh(db_prediction)
        return db_prediction.id
    except Exception as e:
        print(f"Error saving prediction to DB: {e}")
        return 0
    finally:
        db.close()

def save_feedback_record(prediction_id: int, rating: int, comments: str) -> bool:
    """Saves user rating for a prediction."""
    db = SessionLocal()
    try:
        db_feedback = Feedback(
            prediction_id=prediction_id,
            accuracy_rating=rating,
            comments=comments
        )
        db.add(db_feedback)
        db.commit()
        return True
    except Exception as e:
        print(f"Error saving feedback to DB: {e}")
        return False
    finally:
        db.close()

def get_prediction_history(limit: int = 15):
    """Retrieves list of latest prediction inputs and outputs."""
    db = SessionLocal()
    try:
        return db.query(Prediction).order_by(Prediction.timestamp.desc()).limit(limit).all()
    except Exception as e:
        print(f"Error reading prediction history: {e}")
        return []
    finally:
        db.close()
