
import { useEffect } from 'react';
import janusService from '@/services/JanusService';
import audioService from '@/services/AudioService';
import { AudioOutputHandler } from '@/services/janus/utils/audioOutputHandler';

export const useVideoStreams = (
  isCallActive: boolean,
  localVideoRef: React.RefObject<HTMLVideoElement>,
  remoteVideoRef: React.RefObject<HTMLVideoElement>
) => {
  useEffect(() => {
    if (isCallActive) {
      const localStream = janusService.getLocalStream();
      const remoteStream = janusService.getRemoteStream();
      
      console.log("Local stream in useVideoStreams:", localStream);
      console.log("Remote stream in useVideoStreams:", remoteStream);
      
      if (localVideoRef.current && localStream) {
        localVideoRef.current.srcObject = localStream;
        localVideoRef.current.muted = true; // Mute local stream to prevent echo
      }
      
      if (remoteVideoRef.current && remoteStream) {
        console.log("Setting remote stream to video element");
        remoteVideoRef.current.srcObject = remoteStream;
        
        // Ensure audio playback is properly enabled
        remoteVideoRef.current.muted = false;
        remoteVideoRef.current.volume = 1.0;
        
        // Add specific audio trace logging
        const audioTracks = remoteStream.getAudioTracks();
        console.log("Remote stream audio tracks:", audioTracks.length);
        audioTracks.forEach((track, idx) => {
          console.log(`Audio track ${idx}:`, {
            enabled: track.enabled,
            muted: track.muted,
            readyState: track.readyState,
            id: track.id,
          });
          // Ensure tracks are enabled
          track.enabled = true;
        });
        
        // Try to play the video element (for video calls)
        if (remoteVideoRef.current) {
          const playPromise = remoteVideoRef.current.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => console.log("Remote video playback started successfully"))
              .catch(error => {
                console.error("Error playing remote video:", error);
                // If video fails to play, ensure audio still works via AudioService
                if (remoteStream.getAudioTracks().length > 0) {
                  console.log("Video playback failed, ensuring audio works via AudioService");
                  audioService.attachStream(remoteStream);
                }
              });
          }
        }
        
        // Get and set audio output device
        const savedAudioOutput = localStorage.getItem('selectedAudioOutput');
        if (savedAudioOutput) {
          console.log("Setting saved audio output device:", savedAudioOutput);
          AudioOutputHandler.setupRemoteAudio(remoteStream, savedAudioOutput);
        } else {
          // Even without a specific output device, set up the audio
          AudioOutputHandler.setupRemoteAudio(remoteStream);
        }
        
        // Force audio playback without requiring user interaction
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
            })
            .catch(e => console.warn("Auto-play attempt error:", e));
        }, 300);
      } else if (remoteStream) {
        // Audio-only call - just use the audio service
        console.log("Audio-only call, using AudioService for playback");
        audioService.attachStream(remoteStream);
        
        // Apply audio output device if supported
        const savedAudioOutput = localStorage.getItem('selectedAudioOutput');
        if (savedAudioOutput) {
          audioService.setAudioOutput(savedAudioOutput)
            .catch(error => console.warn("Couldn't set audio output:", error));
        }
        
        // Try to auto-play the audio immediately
        setTimeout(() => {
          console.log("Attempting to auto-play audio for audio-only call");
          audioService.forcePlayAudio()
            .then(success => {
              if (!success) {
                return AudioOutputHandler.checkAndPlayRemoteAudio();
              }
              return success;
            })
            .catch(e => console.warn("Auto-play error:", e));
        }, 300);
      }
      
      // Setup a periodic check for audio playback
      const audioCheckInterval = setInterval(() => {
        console.log("Periodic audio check - Is audio playing:", audioService.isAudioPlaying());
        if (!audioService.isAudioPlaying() && remoteStream) {
          console.log("Audio not playing, attempting to force play");
          audioService.forcePlayAudio().catch(e => console.warn("Force play failed:", e));
        }
      }, 5000);
      
      // Clean up when the component unmounts or call ends
      return () => {
        clearInterval(audioCheckInterval);
        // Don't remove the audio element, just clean up resources
        audioService.cleanup();
      };
    }
  }, [isCallActive, localVideoRef, remoteVideoRef]);
};
