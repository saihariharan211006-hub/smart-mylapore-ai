import os
import json
import numpy as np
import pandas as pd
from typing import Dict, Any
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, HistGradientBoostingClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import joblib

def generate_mylapore_dataset(num_samples: int = 5000) -> pd.DataFrame:
    """
    Generates a simulated dataset for Mylapore traffic and parking.
    Features:
        - hour: 0-23
        - day_of_week: 0-6 (0=Monday)
        - weather: 0=sunny, 1=cloudy, 2=rainy, 3=stormy
        - festival: 0=none, 1=Panguni Peruvizha
        - holiday: 0=no, 1=yes
        - source: 0=Luz Corner, 1=Temple, 2=Mandaveli, 3=Greenways Rd
        - destination: 0=Luz Corner, 1=Temple, 2=Mandaveli, 3=Greenways Rd
    """
    np.random.seed(42)
    
    hour = np.random.randint(0, 24, num_samples)
    day_of_week = np.random.randint(0, 7, num_samples)
    weather = np.random.choice([0, 1, 2, 3], size=num_samples, p=[0.5, 0.3, 0.15, 0.05])
    festival = np.random.choice([0, 1], size=num_samples, p=[0.95, 0.05])
    
    # Holidays: weekends or random official holidays
    holiday = ((day_of_week >= 5) | (np.random.choice([0, 1], size=num_samples, p=[0.97, 0.03]))).astype(int)
    
    source = np.random.randint(0, 4, num_samples)
    # Ensure source and destination are different
    destination = (source + np.random.randint(1, 4, num_samples)) % 4
    
    # Calculate travel congestion score baseline
    # High base in business hours 8-10 AM, 5-8 PM
    is_peak = ((hour >= 8) & (hour <= 10)) | ((hour >= 17) & (hour <= 20))
    
    congestion_score = 20.0 + 10.0 * is_peak
    # Weather penalty
    congestion_score += weather * 12.0
    # Festival penalty near the temple
    is_near_temple = (source == 1) | (destination == 1)
    congestion_score += festival * is_near_temple * 40.0
    # Holiday relief (lower commuter traffic, but higher festival traffic)
    congestion_score += holiday * (-10.0 + festival * 25.0)
    
    # Add random noise
    congestion_score += np.random.normal(0, 8, num_samples)
    congestion_score = np.clip(congestion_score, 0, 100)
    
    # Categorize congestion (0=Low, 1=Moderate, 2=Heavy)
    congestion_class = []
    for score in congestion_score:
        if score < 40:
            congestion_class.append(0) # Low
        elif score < 70:
            congestion_class.append(1) # Moderate
        else:
            congestion_class.append(2) # Heavy
            
    # Calculate travel times (minutes)
    base_times = {
        (0, 1): 8, (0, 2): 10, (0, 3): 15,
        (1, 0): 8, (1, 2): 6, (1, 3): 12,
        (2, 0): 10, (2, 1): 6, (2, 3): 8,
        (3, 0): 15, (3, 1): 12, (3, 2): 8
    }
    
    travel_time = []
    for s, d, score in zip(source, destination, congestion_score):
        base = base_times.get((s, d), 10)
        # congestion multiplier
        mult = 1.0 + (score / 35.0)
        travel_time.append(round(base * mult))
        
    # Calculate Parking Occupancy (Zones A, B, C)
    # Zone A (Premium Temple)
    occupancy_A = 30 + 35 * np.exp(-((hour - 12)**2)/16) + festival * 35 - holiday * 5 + np.random.normal(0, 5, num_samples)
    # Zone B (Luz Corner standard)
    occupancy_B = 25 + 45 * np.exp(-((hour - 14)**2)/25) + festival * 15 + holiday * 10 + np.random.normal(0, 5, num_samples)
    # Zone C (Mada Street Eco)
    occupancy_C = 20 + 55 * np.exp(-((hour - 17)**2)/36) + festival * 20 - holiday * 10 + np.random.normal(0, 5, num_samples)
    
    occupancy_A = np.clip(occupancy_A, 5, 99).astype(int)
    occupancy_B = np.clip(occupancy_B, 5, 99).astype(int)
    occupancy_C = np.clip(occupancy_C, 5, 99).astype(int)
    
    df = pd.DataFrame({
        "hour": hour,
        "day_of_week": day_of_week,
        "weather": weather,
        "festival": festival,
        "holiday": holiday,
        "source": source,
        "destination": destination,
        "congestion_class": congestion_class,
        "travel_time": travel_time,
        "occupancy_A": occupancy_A,
        "occupancy_B": occupancy_B,
        "occupancy_C": occupancy_C
    })
    return df

def train_and_compare_models():
    print("Generating simulated historical dataset...")
    df = generate_mylapore_dataset()
    
    X = df[["hour", "day_of_week", "weather", "festival", "holiday", "source", "destination"]]
    y = df["congestion_class"]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Models to compare
    models = {
        "Random Forest": RandomForestClassifier(n_estimators=100, random_state=42),
        "Gradient Boosting": GradientBoostingClassifier(random_state=42),
        "Decision Tree": DecisionTreeClassifier(random_state=42),
        "HistGradient Boosting": HistGradientBoostingClassifier(random_state=42)
    }
    
    best_f1 = 0
    best_name = ""
    best_clf = None
    all_metrics = {}
    
    print("\nTraining and comparing models:")
    for name, model in models.items():
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, average='weighted')
        rec = recall_score(y_test, y_pred, average='weighted')
        f1 = f1_score(y_test, y_pred, average='weighted')
        
        all_metrics[name] = {
            "accuracy": round(acc * 100, 2),
            "precision": round(prec * 100, 2),
            "recall": round(rec * 100, 2),
            "f1_score": round(f1 * 100, 2)
        }
        
        print(f"[{name}] Acc: {acc:.4f} | F1: {f1:.4f}")
        
        if f1 > best_f1:
            best_f1 = f1
            best_name = name
            best_clf = model
            
    print(f"\nBest Model selected: {best_name} (F1 Score: {best_f1:.4f})")
    
    # Calculate confusion matrix for best model
    best_pred = best_clf.predict(X_test)
    cm = confusion_matrix(y_test, best_pred).tolist()
    
    # Save the models directory
    model_dir = os.path.join(os.path.dirname(__file__), "models")
    os.makedirs(model_dir, exist_ok=True)
    
    # Save best classifier
    classifier_path = os.path.join(model_dir, "traffic_congestion_model.joblib")
    joblib.dump(best_clf, classifier_path)
    
    # Train auxiliary regressors for travel time and parking occupancies (using RandomForest)
    print("Training travel time and parking occupancy models...")
    rf_time = RandomForestClassifier(n_estimators=100, random_state=42) # binning travel times or regressor
    
    # Simple linear regressor or tree regressor for travel time and parking
    from sklearn.tree import DecisionTreeRegressor
    reg_time = DecisionTreeRegressor(random_state=42).fit(X_train, df.loc[X_train.index, "travel_time"])
    reg_park_A = DecisionTreeRegressor(random_state=42).fit(X_train, df.loc[X_train.index, "occupancy_A"])
    reg_park_B = DecisionTreeRegressor(random_state=42).fit(X_train, df.loc[X_train.index, "occupancy_B"])
    reg_park_C = DecisionTreeRegressor(random_state=42).fit(X_train, df.loc[X_train.index, "occupancy_C"])
    
    joblib.dump(reg_time, os.path.join(model_dir, "travel_time_model.joblib"))
    joblib.dump(reg_park_A, os.path.join(model_dir, "parking_occupancy_A.joblib"))
    joblib.dump(reg_park_B, os.path.join(model_dir, "parking_occupancy_B.joblib"))
    joblib.dump(reg_park_C, os.path.join(model_dir, "parking_occupancy_C.joblib"))
    
    # Save comparison metrics and confusion matrix
    metadata = {
        "best_model_name": best_name,
        "comparison": all_metrics,
        "confusion_matrix": cm,
        "labels": ["Low", "Moderate", "Heavy"]
    }
    
    with open(os.path.join(model_dir, "model_comparison_metrics.json"), "w") as f:
        json.dump(metadata, f, indent=4)
        
    print(f"All models and comparison statistics saved to {model_dir}")

if __name__ == "__main__":
    train_and_compare_models()
