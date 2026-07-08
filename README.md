# 🗺️ Smart Mylapore AI: Immersive 3D Digital Twin & Mobility Predictor

**Smart Mylapore AI** is a futuristic, immersive 3D digital twin and machine learning prediction platform for urban routing and parking management. It transforms traffic analysis into a cinematic, real-time interactive simulation modeled after modern operating systems.

---

## 🌟 Key Features

*   **Fullscreen 3D Digital Twin**: Rendered in real-time using Three.js (r128), featuring accurate models of:
    *   *Kapaleeshwarar Temple Gopuram* (7-tiered terracotta tower with golden Kalasams)
    *   *Santhome Church* (gothic spires and ambient glows)
    *   *Luz Corner Crossroads* & Margins (with dynamic shop windows)
    *   *Active Vehicles & Pedestrians* (MTC buses, auto rickshaws, cars, and walking crowds)
*   **Vision Pro Floating HUD**: Frosted glassmorphism panels featuring backdrop blur, glowing borders, hover elevation, and interactive neon gauges.
*   **Cinema-Style Camera Rig**: Preset view modes available via a floating dock:
    *   `Live 3D Map` (Slow drone orbit around the temple)
    *   `Traffic Camera` (Top-down crossroads surveillance perspective)
    *   `Parking Spots` (Zoomed forecast on active parking garages)
    *   `Festivals & Events` (Zoomed view on Gopuram steps with glowing lamps)
*   **Ambient Mix Deck**: Continuous Web Audio API synthesizers yielding custom soundscapes:
    *   *Temple Bells* (Resonant multi-oscillator additive synthesis)
    *   *Birds Ambience* (Random pitch-sweeping chirps)
    *   *Traffic Hum* (Continuous lowpass noise generator)
    *   *Rain Static* (Bandpass static, dynamically controlled by weather presets)
*   **Voice Assistant Orb**: breathing glowing assistant breathing widget. Supports Tamil and English speech output.
*   **AI Laser Scanning**: Animated grid scans and ping ripples executing during ML inference runs.

---

## 🛠️ Tech Stack

### Backend & Machine Learning
*   **Python**: Version 3.14.
*   **FastAPI**: Uvicorn-hosted REST API routing.
*   **Scikit-Learn**: Gradient Boosting Classifiers (trained to **87.02%** accuracy) and regressors for parking zone occupancy.
*   **SQLAlchemy / SQLite**: Automated database logs for predictions and user ratings.

### Frontend Client
*   **React & Tailwind CSS**: Glassmorphic UI controls.
*   **Three.js & OrbitControls**: 3D scene engine and interactive mouse dampening.
*   **Babel Standalone**: In-browser compiler for TypeScript/JSX modules, enabling zero-build execution.

---

## 📂 Project Structure

```
smart-mylapore-ai/
  ├── backend/
  │    ├── app/
  │    │    ├── database/     # SQLAlchemy SQLite configuration
  │    │    ├── ml/           # Train pipelines and model binaries (.joblib)
  │    │    └── main.py       # FastAPI routing and static file mounts
  │    └── requirements.txt   # Python package dependencies
  ├── frontend/
  │    ├── src/
  │    │    ├── components/   # LeftPanel, CenterPanel, RightPanel HUDs
  │    │    ├── three/        # R3F canvas components
  │    │    ├── utils/        # Audio synthesizers and speech engines
  │    │    └── App.jsx       # Master visual dashboard module
  │    ├── index.html         # Main page loader (includes CDN links)
  │    └── package.json       # Node packaging config
  └── README.md               # Project documentation
```

---

## 🚀 Running the Project

1.  **Clone this repository**:
    ```bash
    git clone https://github.com/saihariharan211006-hub/smart-mylapore-ai.git
    cd smart-mylapore-ai
    ```

2.  **Start the Backend API Server**:
    Ensure Python is installed, install the requirements, and run the server:
    ```bash
    pip install -r backend/requirements.txt
    python -m uvicorn backend.app.main:app --reload --port 8000
    ```

3.  **Open the Client Dashboard**:
    Navigate to [http://127.0.0.1:8000/](http://127.0.0.1:8000/) in your web browser. Enjoy the immersive experience!
