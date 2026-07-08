import React, { useState, useEffect, useMemo } from 'react';
import { LeftPanel } from './components/LeftPanel';
import { RightPanel } from './components/RightPanel';
import { CenterPanel } from './components/CenterPanel';
import { Charts as AccuracyCharts } from './components/Charts';
import { MylaporeScene } from './three/MylaporeScene';
import { VoiceAssistant } from './components/VoiceAssistant';
import { BottomDock } from './components/BottomDock';

import {
  playTempleBell,
  playUIClick,
  playSuccessChime,
  startTrafficHum,
  stopTrafficHum,
  startRainHum,
  stopRainHum,
  startBirdsScheduler,
  stopBirdsScheduler,
  toggleMute
} from './utils/audioSynth';

import {
  setVoiceMuted,
  speakAlert
} from './utils/voiceEngine';

const App: React.FC = () => {
  const [source, setSource] = useState<string>("Luz Corner");
  const [destination, setDestination] = useState<string>("Kapaleeshwarar Temple");
  const [hour, setHour] = useState<number>(8);
  const [dayOfWeek, setDayOfWeek] = useState<number>(0);
  const [weather, setWeather] = useState<string>("sunny");
  const [festival, setFestival] = useState<boolean>(false);
  const [holiday, setHoliday] = useState<boolean>(false);
  
  // HUD states
  const [cameraMode, setCameraMode] = useState<'drone' | 'temple' | 'traffic' | 'free'>('drone');
  const [activeLayer, setActiveLayer] = useState<string>('map');
  const [sfxOn, setSfxOn] = useState<boolean>(true);
  const [voiceOn, setVoiceOn] = useState<boolean>(true);
  const [lang, setLang] = useState<"en" | "ta">("en");

  // State payloads
  const [predictionResults, setPredictionResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Default values before fetching
  const defaultParkingOccupancies = { A: 23, B: 33, C: 26 };
  const parkingOccupancies = useMemo(() => {
    if (!predictionResults || !predictionResults.parking) return defaultParkingOccupancies;
    return {
      A: predictionResults.parking[0].occupancy_rate_percent,
      B: predictionResults.parking[1].occupancy_rate_percent,
      C: predictionResults.parking[2].occupancy_rate_percent
    };
  }, [predictionResults]);

  const fetchPredictions = async (triggerVoice = false) => {
    setIsLoading(true);
    playUIClick();
    
    const formattedHour = hour.toString().padStart(2, '0');
    const timeStr = `${formattedHour}:00`;
    
    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source,
          destination,
          time: timeStr,
          day_of_week: dayOfWeek,
          weather,
          festival,
          holiday
        })
      });
      
      if (!response.ok) throw new Error("HTTP prediction failed");
      const data = await response.json();
      
      setPredictionResults(data);
      playSuccessChime();

      if (triggerVoice && voiceOn) {
        const text = lang === 'ta' 
          ? `கணிப்பு முடிந்தது. லஸ் கார்னர் மற்றும் மங்களூர் சாலைகளில் போக்குவரத்து நிலை: ${data.traffic.congestion_level}.`
          : `Prediction completed. Congestion index is ${data.traffic.congestion_level}. Expected travel time is ${data.traffic.travel_time_minutes} minutes.`;
        speakAlert(text, lang);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    startTrafficHum();
    startRainHum();
    startBirdsScheduler();
    fetchPredictions(false);
    return () => {
      stopTrafficHum();
      stopRainHum();
      stopBirdsScheduler();
    };
  }, []);

  // Update hum settings on toggle
  useEffect(() => {
    toggleMute(!sfxOn);
  }, [sfxOn]);

  useEffect(() => {
    setVoiceMuted(!voiceOn);
  }, [voiceOn]);

  const handleOrbClick = () => {
    playTempleBell();
    const text = lang === 'ta'
      ? "வணக்கம்! ஸ்மார்ட் மயிலாப்பூர் மொபிலிட்டி உதவிக்கு உங்களை வரவேக்கூறுகிறோம்."
      : "Vanakkam! Welcome to Mylapore Smart Mobility Assistant. I will help you find parking and routes.";
    speakAlert(text, lang);
  };

  return (
    <div className="relative min-h-screen text-gray-100 font-sans overflow-hidden bg-[#050816]">
      {/* 1. Immersion 3D Real-time scene background */}
      <div className="fixed inset-0 w-screen h-screen z-0 pointer-events-auto">
        <MylaporeScene 
          hour={hour}
          weather={weather}
          congestionLevel={predictionResults?.traffic.congestion_level || "Low"}
          parkingOccupancies={parkingOccupancies}
          cameraMode={cameraMode}
        />
      </div>

      {/* 2. Glassmorphic absolute HUD layout overlay */}
      
      {/* Top Header Panel */}
      <header className="absolute top-0 left-0 right-0 p-5 px-8 flex items-center justify-between z-20 select-none bg-gradient-to-b from-[#050816]/70 to-transparent backdrop-blur-xs pointer-events-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-electric-cyan to-royal-blue rounded-xl flex items-center justify-center font-black text-dark-obsidian text-lg shadow-neon-cyan select-none">
            MY
          </div>
          <div>
            <h1 className="text-md md:text-lg font-black font-display text-white tracking-tight uppercase">
              AI-Based Smart Traffic & Parking Prediction
            </h1>
            <div className="flex items-center gap-2.5 mt-0.5">
              <span className="flex items-center gap-1 text-[8px] text-electric-cyan uppercase tracking-widest font-semibold">
                <span className="w-1.5 h-1.5 bg-electric-cyan rounded-full pulse-dot-cyan"></span> Live Prediction
              </span>
              <span className="text-[8px] text-gray-400 font-bold uppercase">•</span>
              <span className="flex items-center gap-1 text-[8px] text-purple-400 uppercase tracking-widest font-semibold">
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span> ML Powered
              </span>
            </div>
          </div>
        </div>

        {/* Global toggles and dropdown selectors */}
        <div className="flex items-center gap-3">
          {/* Language selection */}
          <button 
            type="button"
            onClick={() => { setLang(lang === 'en' ? 'ta' : 'en'); playUIClick(); }}
            className="p-1.5 px-3 rounded-full border border-white/10 bg-slate-950/40 hover:bg-white/5 text-gray-300 font-bold text-[10px] cursor-pointer transition-colors"
          >
            {lang === 'en' ? 'English' : 'தமிழ்'}
          </button>

          {/* Voice Engine toggle */}
          <button 
            type="button"
            onClick={() => { playUIClick(); setVoiceOn(!voiceOn); }}
            className={`p-1.5 px-3 rounded-full border text-[10px] font-bold cursor-pointer transition-colors ${
              voiceOn 
                ? 'border-electric-cyan/20 bg-electric-cyan/10 text-electric-cyan' 
                : 'border-white/10 bg-slate-950/40 text-gray-400'
            }`}
          >
            {voiceOn ? 'Voice On' : 'Voice Off'}
          </button>
        </div>
      </header>

      {/* Left Column HUD Overlay */}
      <div className="absolute top-24 left-6 z-10 w-[310px] flex flex-col gap-4 max-h-[82vh] overflow-y-auto no-scrollbar pb-6 pointer-events-auto">
        <LeftPanel 
          hour={hour}
          dayOfWeek={dayOfWeek}
          weather={weather}
          weatherStats={predictionResults?.weather || { temperature_celsius: 32, humidity_percent: 55, wind_speed_kmh: 8 }}
          congestionLevel={predictionResults?.traffic.congestion_level || "Low"}
          congestionColor={predictionResults?.traffic.congestion_color || "#22C55E"}
        />
        
        {predictionResults && predictionResults.ml_accuracy_metrics && (
          <AccuracyCharts metrics={predictionResults.ml_accuracy_metrics} />
        )}
      </div>

      {/* Center Bottom HUD Trip Planner Card */}
      <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-10 w-[420px] max-w-[90vw] pointer-events-auto">
        <CenterPanel
          source={source}
          setSource={setSource}
          destination={destination}
          setDestination={setDestination}
          hour={hour}
          setHour={setHour}
          dayOfWeek={dayOfWeek}
          setDayOfWeek={setDayOfWeek}
          weather={weather}
          setWeather={setWeather}
          festival={festival}
          setFestival={setFestival}
          holiday={holiday}
          setHoliday={setHoliday}
          predict={() => fetchPredictions(true)}
          isLoading={isLoading}
        />
      </div>

      {/* Right Column HUD Overlay */}
      <div className="absolute top-24 right-6 z-10 w-[320px] flex flex-col gap-4 max-h-[82vh] overflow-y-auto no-scrollbar pb-6 pointer-events-auto">
        <RightPanel predictionResults={predictionResults} />
      </div>

      {/* 3. Apple Vision Pro inspired Bottom Dock */}
      <BottomDock 
        activeLayer={activeLayer}
        setActiveLayer={setActiveLayer}
        sfxOn={sfxOn}
        setSfxOn={setSfxOn}
        voiceOn={voiceOn}
        setVoiceOn={setVoiceOn}
        cameraMode={cameraMode}
        setCameraMode={setCameraMode}
      />

      {/* 4. Scanning laser beam during predictions */}
      {isLoading && (
        <div className="scanner-container">
          <div className="laser-line"></div>
        </div>
      )}

      {/* 5. Floating AI voice assistant orb bottom right */}
      <VoiceAssistant onOrbClick={handleOrbClick} />
    </div>
  );
};

export default App;
