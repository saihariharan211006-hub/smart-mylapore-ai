import React from 'react';

interface VoiceAssistantProps {
  onOrbClick: () => void;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onOrbClick }) => {
  return (
    <div className="fixed bottom-6 right-6 z-20 flex flex-col items-end" id="voice-assistant-orb-wrapper">
      <button 
        type="button"
        onClick={onOrbClick}
        className="w-14 h-14 bg-gradient-to-tr from-electric-cyan to-royal-blue rounded-full animate-orb flex items-center justify-center text-dark-obsidian cursor-pointer active:scale-95 transition focus:outline-none"
        title="Smart Assistant Voice Guide"
      >
        <svg className="w-6 h-6 text-dark-obsidian" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"></path>
        </svg>
      </button>
    </div>
  );
};
