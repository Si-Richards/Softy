
import { useEffect } from 'react';
import janusService from '@/services/JanusService';
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
      
      console.log("Local stream in Dialpad:", localStream);
      console.log("Remote stream in Dialpad:", remoteStream);
      
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
        
        // Set up a dedicated audio element for the remote stream
        const savedAudioOutput = localStorage.getItem('selectedAudioOutput');
        const audioElement = AudioOutputHandler.setupRemoteAudio(remoteStream, savedAudioOutput);
        
        // Try to play the video element (for video calls)
        if (remoteVideoRef.current) {
          const playPromise = remoteVideoRef.current.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => console.log("Remote video playback started successfully"))
              .catch(error => {
                console.error("Error playing remote video:", error);
              });
          }
        }
        
        // Set up a periodic check for audio playback status
        const audioCheckInterval = setInterval(() => {
          const audioElement = document.querySelector('audio#remoteAudio') as HTMLAudioElement;
          if (audioElement) {
            const isPaused = audioElement.paused;
            if (isPaused) {
              console.log("Audio element is paused, user may need to interact");
            }
          }
        }, 5000);
        
        return () => {
          clearInterval(audioCheckInterval);
        };
      }
    }
  }, [isCallActive, localVideoRef, remoteVideoRef]);
};
