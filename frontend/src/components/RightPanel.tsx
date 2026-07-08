import React, { useState, useEffect } from 'react';
import { Shield, Navigation, Compass, AlertCircle, Sparkles } from 'lucide-react';

interface ParkingZone {
  zone_id: string;
  name: string;
  occupancy_rate_percent: number;
  total_slots: number;
  free_slots: number;
  distance_meters: number;
  walk_minutes: number;
  pricing: string;
}

interface AlternativeRoute {
  type: string;
  name: string;
  time_minutes: number;
  cost: number;
  score: number;
}

interface RightPanelProps {
  predictionResults: {
    traffic: {
      travel_time_minutes: number;
      average_speed_kmh: number;
      congestion_level: string;
      congestion_color: string;
      confidence_score: number;
    };
    parking: ParkingZone[];
    routes: AlternativeRoute[];
  } | null;
}

// Simple Count-Up utility component for numbers
const CountUp: React.FC<{ end: number; duration?: number; suffix?: string }> = ({ end, duration = 1000, suffix = "" }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const endVal = Math.floor(end);
    if (endVal === 0) {
      setCount(0);
      return;
    }
    const totalSteps = 25;
    const stepTime = duration / totalSteps;
    const increment = endVal / totalSteps;
    
    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      start += increment;
      if (currentStep >= totalSteps) {
        clearInterval(timer);
        setCount(endVal);
      } else {
        setCount(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [end, duration]);

  return <span>{count}{suffix}</span>;
};

// Circular Progress Wheel component
const CircularProgress: React.FC<{ percent: number; color: string; size?: number }> = ({ percent, color, size = 64 }) => {
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2 - 4;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          className="text-white/5"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute text-[10px] font-black text-white font-mono">
        {percent}%
      </div>
    </div>
  );
};

export const RightPanel: React.FC<RightPanelProps> = ({ predictionResults }) => {
  return (
    <div className="glass-panel p-5 flex flex-col gap-5 select-none animate-float-medium" id="right-panel-container">
      <h3 className="text-md font-black tracking-wide text-white border-b border-white/5 pb-2">
        AI Real-time Forecast
      </h3>

      {predictionResults ? (
        <div className="flex flex-col gap-5">
          {/* Traffic Congestion Metric */}
          <div className="bg-slate-950/45 p-4 rounded-2xl border border-white/5 flex flex-col gap-3">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-gray-400 uppercase tracking-widest font-bold">Traffic Predictor</span>
              <span className="text-electric-cyan font-semibold flex items-center gap-1">
                <Shield className="w-3 h-3" /> Confidence <CountUp end={predictionResults.traffic.confidence_score} suffix="%" />
              </span>
            </div>
            
            <div className="flex items-center justify-between mt-1">
              <div>
                <h4 className="text-lg font-black tracking-wide uppercase" style={{ color: predictionResults.traffic.congestion_color }}>
                  {predictionResults.traffic.congestion_level} congestion
                </h4>
                <p className="text-[10px] text-gray-400 mt-0.5">Delay is expected at destination</p>
              </div>
              <CircularProgress 
                percent={predictionResults.traffic.congestion_level === 'Heavy' ? 85 : (predictionResults.traffic.congestion_level === 'Moderate' ? 55 : 20)} 
                color={predictionResults.traffic.congestion_color}
              />
            </div>
          </div>

          {/* Travel Duration & Commute */}
          <div className="bg-slate-950/45 p-4 rounded-2xl border border-white/5 flex justify-between items-center">
            <div>
              <p className="text-[9px] text-gray-400 uppercase tracking-widest font-semibold">Commute Estimate</p>
              <h4 className="text-2xl font-black text-white tracking-tight mt-1 font-display">
                <CountUp end={predictionResults.traffic.travel_time_minutes} /> <span className="text-sm font-semibold">Mins</span>
              </h4>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-gray-400 uppercase tracking-widest font-semibold">Avg Speed</p>
              <p className="text-sm font-bold text-gray-200 mt-1 font-mono">
                <CountUp end={predictionResults.traffic.average_speed_kmh} /> km/h
              </p>
            </div>
          </div>

          {/* Parking Availability Forecasting */}
          <div className="bg-slate-950/45 p-4 rounded-2xl border border-white/5 flex flex-col gap-3">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Parking Availability</h4>
            
            {predictionResults.parking.slice(0, 2).map((p) => {
              const freePercent = 100 - p.occupancy_rate_percent;
              const isFull = p.occupancy_rate_percent > 85;
              const isMed = p.occupancy_rate_percent > 60;
              const barColor = isFull ? '#ef4444' : (isMed ? '#ffb000' : '#10b981');
              
              return (
                <div key={p.zone_id} className="border-t border-white/5 pt-2.5 first:border-0 first:pt-0">
                  <div className="flex justify-between items-start text-xs">
                    <div>
                      <p className="font-bold text-gray-200 text-[11px]">{p.name}</p>
                      <p className="text-[9px] text-gray-400 mt-0.5">{p.distance_meters}m away • {p.pricing}</p>
                    </div>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/5 font-semibold" style={{ color: barColor }}>
                      <CountUp end={freePercent} suffix="%" /> Free
                    </span>
                  </div>
                  
                  {/* Progress fill bar */}
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-2">
                    <div 
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ 
                        width: `${freePercent}%`,
                        backgroundColor: barColor,
                        boxShadow: `0 0 8px ${barColor}`
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recommended Commute Path info */}
          <div className="bg-slate-950/45 p-4 rounded-2xl border border-white/5 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 uppercase font-semibold">
              <Navigation className="w-3.5 h-3.5 text-electric-cyan" /> Recommended Route
            </div>
            <div>
              <p className="text-xs font-bold text-white leading-relaxed mt-1">
                Via {predictionResults.routes[0].name.replace(" Route", "")}
              </p>
              <p className="text-[9px] text-gray-400 mt-0.5">
                Distance: 2.3 km • Score: {Math.round(predictionResults.routes[0].score)} pts
              </p>
            </div>
            <button 
              type="button"
              className="w-full mt-2 py-2 bg-royal-blue/20 hover:bg-royal-blue/30 border border-royal-blue/30 rounded-xl text-[10px] font-bold text-royal-blue tracking-wide transition cursor-pointer"
            >
              Analyze in 3D Environment
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
          <AlertCircle className="w-8 h-8 text-gray-500 animate-pulse" />
          <p className="text-xs text-gray-400 max-w-[200px] leading-relaxed">
            Configure trip scenarios below and execute predictions to retrieve AI metrics.
          </p>
        </div>
      )}
    </div>
  );
};
