import React from 'react';
import { 
  Map, 
  Video, 
  ParkingCircle, 
  Sparkles, 
  Bus, 
  CloudSun, 
  AlertTriangle, 
  Sliders,
  Volume2,
  VolumeX
} from 'lucide-react';
import { playUIClick } from '../utils/audioSynth';

interface BottomDockProps {
  activeLayer: string;
  setActiveLayer: (layer: string) => void;
  sfxOn: boolean;
  setSfxOn: (on: boolean) => void;
  voiceOn: boolean;
  setVoiceOn: (on: boolean) => void;
  cameraMode: string;
  setCameraMode: (mode: 'drone' | 'temple' | 'traffic' | 'free') => void;
}

export const BottomDock: React.FC<BottomDockProps> = ({
  activeLayer,
  setActiveLayer,
  sfxOn,
  setSfxOn,
  voiceOn,
  setVoiceOn,
  cameraMode,
  setCameraMode
}) => {

  const items = [
    { id: 'map', label: '3D Map', icon: <Map className="w-5 h-5" /> },
    { id: 'traffic', label: 'Traffic Cam', icon: <Video className="w-5 h-5" /> },
    { id: 'parking', label: 'Parking Lots', icon: <ParkingCircle className="w-5 h-5" /> },
    { id: 'festival', label: 'Festivals', icon: <Sparkles className="w-5 h-5" /> },
    { id: 'bus', label: 'MTC Transit', icon: <Bus className="w-5 h-5" /> },
    { id: 'weather', label: 'Weather Layer', icon: <CloudSun className="w-5 h-5" /> },
    { id: 'emergency', label: 'SOS Emergency', icon: <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" /> },
  ];

  const handleLayerClick = (id: string) => {
    playUIClick();
    setActiveLayer(id);
  };

  const handleCameraCycle = () => {
    playUIClick();
    const modes: ('drone' | 'temple' | 'traffic' | 'free')[] = ['drone', 'temple', 'traffic', 'free'];
    const currentIdx = modes.indexOf(cameraMode as any);
    const nextIdx = (currentIdx + 1) % modes.length;
    setCameraMode(modes[nextIdx]);
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 select-none pointer-events-auto">
      <div className="vision-dock flex items-center justify-between gap-2 p-2.5 px-6 border border-white/10 bg-slate-950/60 backdrop-blur-2xl rounded-full">
        {/* Layer Toggles */}
        <div className="flex items-center gap-1.5 border-r border-white/10 pr-4 mr-2">
          {items.map((item) => {
            const isActive = activeLayer === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleLayerClick(item.id)}
                className={`relative group p-3 rounded-full transition-all duration-300 hover:scale-120 hover:bg-white/5 flex items-center justify-center cursor-pointer ${
                  isActive 
                    ? 'bg-electric-cyan/20 border border-electric-cyan/35 text-electric-cyan shadow-neon-cyan' 
                    : 'text-gray-400 border border-transparent'
                }`}
                title={item.label}
              >
                {item.icon}
                <span className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-slate-950/90 text-white text-[10px] px-2 py-1 rounded border border-white/10 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick controls on the Dock */}
        <div className="flex items-center gap-2">
          {/* Camera Cycling */}
          <button
            type="button"
            onClick={handleCameraCycle}
            className="group relative p-3 rounded-full hover:scale-120 hover:bg-white/5 border border-white/5 text-gray-300 flex items-center justify-center cursor-pointer"
            title={`Camera: ${cameraMode}`}
          >
            <Sliders className="w-5 h-5 text-royal-blue" />
            <span className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-slate-950/90 text-white text-[10px] px-2 py-1 rounded border border-white/10 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
              Cam Mode: {cameraMode.toUpperCase()}
            </span>
          </button>

          {/* SFX Toggle */}
          <button
            type="button"
            onClick={() => { playUIClick(); setSfxOn(!sfxOn); }}
            className={`group relative p-3 rounded-full hover:scale-120 hover:bg-white/5 border flex items-center justify-center cursor-pointer ${
              sfxOn ? 'border-electric-cyan/20 text-electric-cyan' : 'border-white/5 text-gray-500'
            }`}
            title={sfxOn ? 'Mute SFX' : 'Unmute SFX'}
          >
            {sfxOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            <span className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-slate-950/90 text-white text-[10px] px-2 py-1 rounded border border-white/10 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
              {sfxOn ? 'SFX On' : 'SFX Off'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
