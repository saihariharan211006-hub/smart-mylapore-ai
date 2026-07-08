let voiceMuted = false;

export const setVoiceMuted = (muted: boolean) => {
  voiceMuted = muted;
  if (voiceMuted && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};

/**
 * Uses browser Web Speech API to synthesize text alerts.
 * Supports English and Tamil fallback.
 */
export const speakAlert = (text: string, lang: 'en' | 'ta' = 'en') => {
  if (voiceMuted) return;
  if (!('speechSynthesis' in window)) {
    console.warn("Web Speech API is not supported in this browser.");
    return;
  }

  try {
    // Cancel previous speech immediately to avoid overlapping audio
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Choose appropriate voice
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = null;
    
    if (lang === 'ta') {
      utterance.lang = 'ta-IN';
      // Search for Tamil voice
      selectedVoice = voices.find(v => v.lang.startsWith('ta') || v.name.toLowerCase().includes('tamil'));
    }
    
    // Fallback or default English voice
    if (!selectedVoice) {
      utterance.lang = 'en-IN'; // Indian English
      selectedVoice = voices.find(
        v => v.lang.startsWith('en') && (v.lang.includes('IN') || v.lang.includes('GB') || v.lang.includes('US'))
      );
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    // Pitch and rate properties
    utterance.pitch = 1.05; // Slightly futuristic synth pitch
    utterance.rate = 1.0;  // Standard speaking speed
    
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.error("Speech synthesis failed: ", e);
  }
};

// Auto-fetch voices when they load (necessary for Chrome/Edge async loading)
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
     // Triggering cache list load
     window.speechSynthesis.getVoices();
  };
}
