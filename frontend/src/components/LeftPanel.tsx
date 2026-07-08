import React, { useState, useEffect } from 'react';
import { Sun, Cloud, CloudRain, CloudLightning, Compass, Wind, Droplets, Clock, Volume2, Music, Bell } from 'lucide-react';
import { 
  setBirdsVolume, 
  setBellsVolume, 
  setTrafficVolume, 
  setRainVolume, 
  playTempleBell,
  playUIClick
} from '../utils/audioSynth';

interface LeftPanelProps {
  hour: number;
  dayOfWeek: number;
  weather: string;
  weatherStats: {
    temperature_celsius: number;
    humidity_percent: number;
    wind_speed_kmh: number;
  };
  congestionLevel: string;
  congestionColor: string;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const LeftPanel: React.FC<LeftPanelProps> = ({
  hour,
  dayOfWeek,
  weather,
  weatherStats,
  congestionLevel,
  congestionColor
}) => {
  // Volume states
  const [birdsVol, setBirdsVol] = useState(40);
  const [bellsVol, setBellsVol] = useState(50);
  const [trafficVol, setTrafficVol] = useState(50);
  const [rainVol, setRainVol] = useState(0);

  // Sync rain volume automatically with rainy weather
  useEffect(() => {
    const isRainy = weather === 'rainy' || weather === 'stormy';
    const targetRainVol = isRainy ? 60 : 0;
    setRainVol(targetRainVol);
    setRainVolume(targetRainVol / 100);
  }, [weather]);

  const handleVolChange = (type: string, value: number) => {
    if (type === 'birds') {
      setBirdsVol(value);
      setBirdsVolume(value / 100);
    } else if (type === 'bells') {
      setBellsVol(value);
      setBellsVolume(value / 100);
    } else if (type === 'traffic') {
      setTrafficVol(value);
      setTrafficVolume(value / 100);
    } else if (type === 'rain') {
      setRainVol(value);
      setRainVolume(value / 100);
    }
  };

  const getFormattedTime = () => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour.toString().padStart(2, '0')}:00 ${period}`;
  };

  const getWeatherIcon = () => {
    switch (weather.toLowerCase()) {
      case 'cloudy':
        return <Cloud className="w-8 h-8 text-slate-300" />;
      case 'rainy':
        return <CloudRain className="w-8 h-8 text-sky-400" />;
      case 'stormy':
        return <CloudLightning className="w-8 h-8 text-purple-400" />;
      case 'fog':
        return <Cloud className="w-8 h-8 text-slate-400 opacity-60" />;
      default:
        return <Sun className="w-8 h-8 text-yellow-400" />;
    }
  };

  return (
    <div className="glass-panel p-5 flex flex-col gap-5 select-none animate-float-slow" id="left-panel-container">
      {/* Welcome Greeting */}
      <div className="border-b border-white/5 pb-3">
        <h2 className="text-lg font-black text-white tracking-wide">Vanakkam! 🙏</h2>
        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
          Welcome to Mylapore. Experience real-time smart mobility & digital twin forecasts.
        </p>
      </div>

      {/* Time & Weather */}
      <div className="bg-slate-950/45 p-4 rounded-2xl border border-white/5 flex flex-col gap-3">
        <div className="flex justify-between items-center border-b border-white/5 pb-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-electric-cyan" />
            <span className="text-sm font-semibold text-white">{getFormattedTime()}</span>
          </div>
          <span className="text-[10px] text-gray-400 uppercase tracking-widest">{DAYS[dayOfWeek].substring(0, 3)}</span>
        </div>

        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-2.5">
            {getWeatherIcon()}
            <div>
              <h3 className="text-sm font-semibold text-white capitalize">{weather}</h3>
              <p className="text-[9px] text-gray-400">Local Climate</p>
            </div>
          </div>
          <span className="text-2xl font-extrabold text-white">{weatherStats.temperature_celsius}°C</span>
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-2 gap-2 text-[10px] mt-1">
          <div className="bg-white/5 p-2 rounded-xl flex items-center gap-2">
            <Droplets className="w-3.5 h-3.5 text-sky-400" />
            <div>
              <span className="text-gray-400 block text-[8px] uppercase">Humid</span>
              <span className="font-semibold text-white">{weatherStats.humidity_percent}%</span>
            </div>
          </div>
          <div className="bg-white/5 p-2 rounded-xl flex items-center gap-2">
            <Wind className="w-3.5 h-3.5 text-teal-400" />
            <div>
              <span className="text-gray-400 block text-[8px] uppercase">Wind</span>
              <span className="font-semibold text-white">{weatherStats.wind_speed_kmh}kmh</span>
            </div>
          </div>
        </div>
      </div>

      {/* Music Player & Soundscapes */}
      <div className="bg-slate-950/45 p-4 rounded-2xl border border-white/5 flex flex-col gap-3.5">
        <div className="flex justify-between items-center border-b border-white/5 pb-2">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold text-gray-200">Mylapore Vibes Synth</span>
          </div>
          
          {/* Animated visualizer */}
          <div className="visualizer-wave active">
            <div className="visualizer-bar"></div>
            <div className="visualizer-bar"></div>
            <div className="visualizer-bar"></div>
            <div className="visualizer-bar"></div>
          </div>
        </div>

        {/* Ambient Volume Sliders */}
        <div className="flex flex-col gap-2.5">
          {/* Temple bells */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-gray-400 flex items-center gap-1.5 cursor-pointer hover:text-white" onClick={() => { playTempleBell(); }}>
                <Bell className="w-3 h-3 text-orange-400 animate-swing" /> Temple Bells (Trigger)
              </span>
              <span className="font-mono text-white text-[9px]">{bellsVol}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={bellsVol} 
              onChange={(e) => handleVolChange('bells', parseInt(e.target.value))}
              className="w-full h-1 bg-white/10 rounded accent-orange-400 cursor-pointer"
            />
          </div>

          {/* Birds ambient */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-gray-400">Birds Ambience</span>
              <span className="font-mono text-white text-[9px]">{birdsVol}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={birdsVol} 
              onChange={(e) => handleVolChange('birds', parseInt(e.target.value))}
              className="w-full h-1 bg-white/10 rounded accent-emerald-400 cursor-pointer"
            />
          </div>

          {/* Traffic hum */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-gray-400">Traffic Hum Synth</span>
              <span className="font-mono text-white text-[9px]">{trafficVol}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={trafficVol} 
              onChange={(e) => handleVolChange('traffic', parseInt(e.target.value))}
              className="w-full h-1 bg-white/10 rounded accent-electric-cyan cursor-pointer"
            />
          </div>

          {/* Rain ambient */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-gray-400">Rain Noise</span>
              <span className="font-mono text-white text-[9px]">{rainVol}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={rainVol} 
              onChange={(e) => handleVolChange('rain', parseInt(e.target.value))}
              className="w-full h-1 bg-white/10 rounded accent-sky-400 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Quick traffic overview alert */}
      <div 
        className="p-3 rounded-2xl flex items-center justify-between border transition-all duration-300"
        style={{
          background: `rgba(${congestionLevel === 'Heavy' ? '239, 68, 68' : (congestionLevel === 'Moderate' ? '255, 176, 0' : '34, 197, 94')}, 0.08)`,
          borderColor: `rgba(${congestionLevel === 'Heavy' ? '239, 68, 68' : (congestionLevel === 'Moderate' ? '255, 176, 0' : '34, 197, 94')}, 0.25)`
        }}
      >
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 animate-spin text-electric-cyan" style={{ animationDuration: '10s' }} />
          <div>
            <p className="text-[8px] text-gray-400 uppercase">Traffic State</p>
            <h5 className="text-[11px] font-bold uppercase tracking-wide" style={{ color: congestionColor }}>
              {congestionLevel} Congestion
            </h5>
          </div>
        </div>
        <span 
          className="w-2.5 h-2.5 rounded-full" 
          style={{ 
            backgroundColor: congestionColor,
            boxShadow: `0 0 8px ${congestionColor}` 
          }}
        />
      </div>
    </div>
  );
};
