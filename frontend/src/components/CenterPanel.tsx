import React, { useState } from 'react';
import { Navigation, Calendar, Clock, Cloud, ToggleLeft, ToggleRight, Sparkles, AlertCircle } from 'lucide-react';
import { playUIClick } from '../utils/audioSynth';

interface CenterPanelProps {
  source: string;
  setSource: (val: string) => void;
  destination: string;
  setDestination: (val: string) => void;
  hour: number;
  setHour: (val: number) => void;
  dayOfWeek: number;
  setDayOfWeek: (val: number) => void;
  weather: string;
  setWeather: (val: string) => void;
  festival: boolean;
  setFestival: (val: boolean) => void;
  holiday: boolean;
  setHoliday: (val: boolean) => void;
  predict: () => void;
  isLoading: boolean;
}

export const CenterPanel: React.FC<CenterPanelProps> = ({
  source, setSource,
  destination, setDestination,
  hour, setHour,
  dayOfWeek, setDayOfWeek,
  weather, setWeather,
  festival, setFestival,
  holiday, setHoliday,
  predict,
  isLoading
}) => {
  const [vehicle, setVehicle] = useState<'car' | 'transit' | 'auto'>('car');
  const getDayLabel = (d: number) => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][d];

  const handlePredictClick = () => {
    playUIClick();
    predict();
  };

  return (
    <div className="glass-panel p-5 scan-line animate-float-slow" id="center-panel-container">
      <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-3.5">
        <h3 className="text-sm font-black tracking-wider text-white flex items-center gap-2">
          <Navigation className="w-4 h-4 text-electric-cyan animate-pulse" /> Plan Your Trip
        </h3>
        <span className="text-[10px] text-electric-cyan bg-electric-cyan/10 px-2 py-0.5 rounded uppercase tracking-wider font-semibold">
          AI Dispatcher
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Source selection */}
        <div>
          <label className="block text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">Starting Source</label>
          <select 
            value={source} 
            onChange={(e) => { playUIClick(); setSource(e.target.value); }}
            className="w-full bg-slate-950/60 border border-white/5 rounded-xl p-2 px-3 outline-none text-xs text-white focus:border-electric-cyan cursor-pointer transition-colors"
          >
            <option value="Luz Corner">Luz Corner</option>
            <option value="Kapaleeshwarar Temple">Kapaleeshwarar Temple</option>
            <option value="Mandaveli">Mandaveli Junction</option>
            <option value="Greenways Rd">Greenways Road Station</option>
          </select>
        </div>

        {/* Destination selection */}
        <div>
          <label className="block text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">Destination</label>
          <select 
            value={destination} 
            onChange={(e) => { playUIClick(); setDestination(e.target.value); }}
            className="w-full bg-slate-950/60 border border-white/5 rounded-xl p-2 px-3 outline-none text-xs text-white focus:border-electric-cyan cursor-pointer transition-colors"
          >
            <option value="Luz Corner">Luz Corner</option>
            <option value="Kapaleeshwarar Temple">Kapaleeshwarar Temple</option>
            <option value="Mandaveli">Mandaveli Junction</option>
            <option value="Greenways Rd">Greenways Road Station</option>
          </select>
        </div>

        {/* Departure Hour slider */}
        <div className="md:col-span-2">
          <label className="flex justify-between text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">
            <span>Departure Schedule</span>
            <span className="text-electric-cyan font-bold font-mono text-[10px]">{hour.toString().padStart(2, '0')}:00</span>
          </label>
          <div className="flex items-center gap-3 mt-1.5">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <input 
              type="range" 
              min="0" 
              max="23" 
              value={hour} 
              onChange={(e) => setHour(parseInt(e.target.value))}
              className="flex-grow accent-electric-cyan h-1 bg-white/10 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Day selection */}
        <div>
          <label className="block text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">Select Day</label>
          <div className="flex gap-1.5 mt-1.5">
            {[0, 2, 4, 5, 6].map(d => (
              <button 
                key={d}
                type="button"
                onClick={() => { playUIClick(); setDayOfWeek(d); }}
                className={`flex-grow py-1.5 rounded-lg font-bold text-[10px] transition cursor-pointer ${
                  dayOfWeek === d 
                    ? 'bg-electric-cyan text-dark-obsidian shadow-neon-cyan' 
                    : 'bg-white/5 border border-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {getDayLabel(d)}
              </button>
            ))}
          </div>
        </div>

        {/* Weather selection */}
        <div>
          <label className="block text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">Climate Condition</label>
          <div className="grid grid-cols-4 gap-1 mt-1.5">
            {["sunny", "cloudy", "rainy", "fog"].map(w => (
              <button 
                key={w}
                type="button"
                onClick={() => { playUIClick(); setWeather(w); }}
                className={`py-1.5 rounded-lg text-[9px] capitalize transition cursor-pointer ${
                  weather === w 
                    ? 'bg-electric-cyan text-dark-obsidian shadow-neon-cyan font-bold' 
                    : 'bg-white/5 border border-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        {/* Toggle options */}
        <div className="md:col-span-2 flex flex-wrap justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5 mt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={festival} 
              onChange={(e) => { playUIClick(); setFestival(e.target.checked); }}
              className="w-3.5 h-3.5 rounded border-white/10 accent-electric-cyan cursor-pointer"
            />
            <span className="text-[10px] text-gray-300 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-orange-400" /> Temple Festival (Panguni)
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={holiday} 
              onChange={(e) => { playUIClick(); setHoliday(e.target.checked); }}
              className="w-3.5 h-3.5 rounded border-white/10 accent-electric-cyan cursor-pointer"
            />
            <span className="text-[10px] text-gray-300 font-semibold">Public Holiday</span>
          </label>
        </div>
      </div>

      {/* Predict Button */}
      <button 
        onClick={handlePredictClick}
        disabled={isLoading}
        className="w-full mt-4 py-3 bg-gradient-to-r from-electric-cyan to-royal-blue text-dark-obsidian font-bold rounded-xl tracking-wider text-xs transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-neon-cyan cursor-pointer"
      >
        {isLoading ? "Running ML Models..." : "Predict Commute Scenario"}
      </button>
    </div>
  );
};
