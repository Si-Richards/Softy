
import { useEffect, useRef } from 'react';
import janusService from '@/services/JanusService';

export const useVideoStreams = (
  isCallActive: boolean,
  localVideoRef: React.RefObject<HTMLVideoElement>,
  remoteVideoRef: React.RefObject<HTMLVideoElement>
) => {
  // Track if audio is playing successfully
  const audioPlayingRef = useRef(false);
  
  useEffect(() => {
    if (isCallActive) {
      const localStream = janusService.getLocalStream();
      const remoteStream = janusService.getRemoteStream();
      
      console.log("Local stream in Dialpad:", localStream);
      console.log("Remote stream in Dialpad:", remoteStream);
      
      // Handle local stream (camera/mic)
      if (localVideoRef.current && localStream) {
        localVideoRef.current.srcObject = localStream;
        localVideoRef.current.muted = true; // Mute local stream to prevent echo
      }
      
      // Handle remote stream (from the other party)
      if (remoteStream) {
        console.log("Remote stream available with tracks:", {
          audioTracks: remoteStream.getAudioTracks().length,
          videoTracks: remoteStream.getVideoTracks().length
        });
        
        // Get all audio elements (both dedicated audio element and video element audio track)
        const audioElements = document.querySelectorAll('audio');
        const remoteVideoElement = remoteVideoRef.current;
        
        // Log details about found audio elements
        console.log(`Found ${audioElements.length} audio elements`);
        
        // First try the video element if we have video
        if (remoteVideoElement) {
          console.log("Setting remote stream to video element");
          remoteVideoElement.srcObject = remoteStream;
          remoteVideoElement.muted = false;
          remoteVideoElement.volume = 1.0;
          
          const playPromise = remoteVideoElement.play();
          if (playPromise !== undefined) {
            playPromise.then(() => {
              console.log("Remote video playback started successfully");
              audioPlayingRef.current = true;
            }).catch(error => {
              console.error("Error playing remote video:", error);
            });
          }
        }
        
        // Also use dedicated audio element as fallback
        if (audioElements.length > 0) {
          for (let i = 0; i < audioElements.length; i++) {
            const audioEl = audioElements[i];
            if (audioEl.hasAttribute('data-testid') && 
                audioEl.getAttribute('data-testid') === 'remote-audio') {
              console.log("Setting remote stream to dedicated audio element");
              audioEl.srcObject = remoteStream;
              audioEl.muted = false;
              audioEl.volume = 1.0;
              
              const audioPlayPromise = audioEl.play();
              if (audioPlayPromise !== undefined) {
                audioPlayPromise.then(() => {
                  console.log("Remote audio playback started successfully");
                  audioPlayingRef.current = true;
                }).catch(audioError => {
                  console.error("Error playing remote audio:", audioError);
                  // Try again with user interaction
                  const handleClick = () => {
                    audioEl.play()
                      .then(() => {
                        console.log("Audio playback started on user interaction");
                        document.removeEventListener('click', handleClick);
                      })
                      .catch(e => console.error("Still failed to play audio:", e));
                  };
                  document.addEventListener('click', handleClick, { once: true });
                });
              }
              break;
            }
          }
        }
        
        // Add specific audio track analysis
        const audioTracks = remoteStream.getAudioTracks();
        console.log("Remote stream audio tracks:", audioTracks.length);
        
        audioTracks.forEach((track, idx) => {
          console.log(`Audio track ${idx}:`, {
            enabled: track.enabled,
            muted: track.muted,
            readyState: track.readyState,
            id: track.id,
            label: track.label,
            contentHint: track.contentHint
          });
          
          // Ensure tracks are enabled
          if (!track.enabled) {
            console.log(`Enabling disabled audio track: ${track.id}`);
            track.enabled = true;
          }
          
          // Add track ended event listener for debugging
          track.addEventListener('ended', () => {
            console.warn(`Audio track ${track.id} ended`);
          });
          
          // Add track mute event listener for debugging
          track.addEventListener('mute', () => {
            console.warn(`Audio track ${track.id} muted`);
          });
          
          track.addEventListener('unmute', () => {
            console.log(`Audio track ${track.id} unmuted`);
          });
        });
        
        // Set up audio analyzer if we have Web Audio API support and audio tracks
        if (window.AudioContext && audioTracks.length > 0 && !audioPlayingRef.current) {
          try {
            const audioContext = new AudioContext();
            const source = audioContext.createMediaStreamSource(remoteStream);
            const analyzer = audioContext.createAnalyser();
            source.connect(analyzer);
            
            // Create audio level monitoring
            const dataArray = new Uint8Array(analyzer.frequencyBinCount);
            const checkAudio = () => {
              if (!isCallActive) return;
              
              analyzer.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
              }
              const average = sum / dataArray.length;
              
              if (average > 0) {
                console.log("Audio level:", average.toFixed(2));
                audioPlayingRef.current = true;
              }
              
              if (isCallActive && !audioPlayingRef.current) {
                requestAnimationFrame(checkAudio);
              }
            };
            
            requestAnimationFrame(checkAudio);
          } catch (error) {
            console.error("Error setting up audio analyzer:", error);
          }
        }
      } else {
        console.warn("No remote stream available yet");
      }
    }
    
    return () => {
      // Cleanup audio analysis if call ends
      audioPlayingRef.current = false;
    };
  }, [isCallActive, localVideoRef, remoteVideoRef]);
};
