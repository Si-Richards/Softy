
import { useEffect } from 'react';
import janusService from '@/services/JanusService';
import audioService from '@/services/AudioService';
import { AudioOutputHandler } from '@/services/janus/utils/audioOutputHandler';
import userInteractionService from '@/services/UserInteractionService';

export const useAudioStreams = (isCallActive: boolean) => {
  useEffect(() => {
    if (isCallActive) {
      const remoteStream = janusService.getRemoteStream();
      
      console.log("Remote stream in useAudioStreams:", remoteStream);
      
      if (remoteStream) {
        // Add specific audio trace logging
        const audioTracks = remoteStream.getAudioTracks();
        console.log("Remote stream audio tracks:", audioTracks.length);
        audioTracks.forEach((track, idx) => {
          console.log(`Audio track ${idx}:`, {
            enabled: track.enabled,
            muted: track.muted,
            readyState: track.readyState,
            id: track.id,
            settings: track.getSettings()
          });
          // Ensure tracks are enabled
          track.enabled = true;
        });
        
        // Get and set audio output device
        const savedAudioOutput = localStorage.getItem('selectedAudioOutput');
        if (savedAudioOutput) {
          console.log("Setting saved audio output device:", savedAudioOutput);
          AudioOutputHandler.setupRemoteAudio(remoteStream, savedAudioOutput);
        } else {
          // Even without a specific output device, set up the audio
          AudioOutputHandler.setupRemoteAudio(remoteStream);
        }
        
        // Audio-only call - use the audio service
        console.log("Audio call, using AudioService for playback");
        audioService.attachStream(remoteStream);
        
        // Apply audio output device if supported
        if (savedAudioOutput) {
          audioService.setAudioOutput(savedAudioOutput)
            .catch(error => console.warn("Couldn't set audio output:", error));
        }
        
        // Force audio playback (after user interaction)
        if (userInteractionService.userHasInteracted()) {
          setTimeout(() => {
            console.log("Attempting to force play audio after short delay");
            audioService.forcePlayAudio()
              .then(success => {
                if (!success) {
                  // Try the backup method
                  return AudioOutputHandler.checkAndPlayRemoteAudio();
                }
                return success;
              })
              .then(finalSuccess => {
                console.log("Auto-play attempt result:", finalSuccess ? "succeeded" : "failed");
                if (!finalSuccess) {
                  // Try last-resort approach: create and play another audio element
                  const fallbackAudio = document.createElement('audio');
                  fallbackAudio.srcObject = remoteStream;
                  fallbackAudio.autoplay = true;
                  document.body.appendChild(fallbackAudio);
                  fallbackAudio.play().catch(e => console.warn("Fallback audio element failed:", e));
                }
              })
              .catch(e => console.warn("Auto-play attempt error:", e));
          }, 300);
        } else {
          console.log("No user interaction yet, listening for first interaction");
          // Create one-time listener for user interaction
          const userInteractionHandler = () => {
            console.log("First user interaction detected - trying to play audio");
            audioService.forcePlayAudio().catch(e => console.warn("Play on first interaction failed:", e));
            document.removeEventListener('click', userInteractionHandler);
            document.removeEventListener('touchstart', userInteractionHandler);
            document.removeEventListener('keydown', userInteractionHandler);
          };
          
          document.addEventListener('click', userInteractionHandler);
          document.addEventListener('touchstart', userInteractionHandler);
          document.addEventListener('keydown', userInteractionHandler);
        }
      }
      
      // Setup a periodic check for audio playback
      const audioCheckInterval = setInterval(() => {
        if (remoteStream) {
          console.log("Periodic audio check - Is audio playing:", audioService.isAudioPlaying());
          console.log("Audio tracks active:", remoteStream.getAudioTracks().filter(t => t.enabled).length);
          
          if (!audioService.isAudioPlaying() && remoteStream.getAudioTracks().length > 0) {
            console.log("Audio not playing, attempting to force play");
            audioService.forcePlayAudio().catch(e => console.warn("Force play failed:", e));
          }
        }
      }, 5000);
      
      // Clean up when the component unmounts or call ends
      return () => {
        clearInterval(audioCheckInterval);
        // Don't remove the audio element, just clean up resources
        audioService.cleanup();
      };
    }
  }, [isCallActive]);
};
