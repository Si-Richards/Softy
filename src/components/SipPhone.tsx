
import React, { useEffect, useRef, useState } from 'react';
import { useSip } from '@/hooks/useSip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, MicOff, Phone, PhoneOff, Video } from 'lucide-react';

const SipPhone: React.FC = () => {
  const [number, setNumber] = useState('');
  const [serverUrl, setServerUrl] = useState('wss://devrtc.voicehost.io:443/janus');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [sipHost, setSipHost] = useState('hpbx.sipconvergence.co.uk:5060');
  
  // References for audio/video elements
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  
  const {
    connectionState,
    registrationState,
    callState,
    error,
    callDuration,
    isIncomingCall,
    incomingCallFrom,
    muted,
    localStream,
    remoteStream,
    connect,
    register,
    call,
    acceptCall,
    hangup,
    toggleMute,
  } = useSip();
  
  // Handle connection
  const handleConnect = async () => {
    try {
      await connect(serverUrl);
    } catch (error) {
      console.error("Connection error:", error);
    }
  };
  
  // Handle registration
  const handleRegister = async () => {
    try {
      await register({
        username,
        password,
        sipHost
      });
    } catch (error) {
      console.error("Registration error:", error);
    }
  };
  
  // Handle making a call
  const handleCall = async () => {
    if (callState !== 'idle' && callState !== 'ended') {
      await hangup();
    } else if (number) {
      try {
        await call(number);
      } catch (error) {
        console.error("Call error:", error);
      }
    }
  };
  
  // Handle accepting an incoming call
  const handleAcceptCall = async () => {
    try {
      await acceptCall();
    } catch (error) {
      console.error("Error accepting call:", error);
    }
  };
  
  // Connect media streams to video elements
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
    
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.play().catch(e => console.error("Error playing audio:", e));
    }
  }, [localStream, remoteStream]);

  return (
    <div className="max-w-md mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>SIP Phone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection Status */}
          <div className="text-sm">
            <div>Connection: <span className={connectionState === 'connected' ? 'text-green-500' : 'text-gray-500'}>{connectionState}</span></div>
            <div>Registration: <span className={registrationState === 'registered' ? 'text-green-500' : 'text-gray-500'}>{registrationState}</span></div>
            <div>Call: <span className={callState === 'active' ? 'text-green-500' : 'text-gray-500'}>{callState}</span></div>
            {callState === 'active' && <div>Duration: {callDuration}</div>}
          </div>
          
          {/* Error Message */}
          {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-2">{error}</div>}
          
          {/* Server Connection */}
          {connectionState !== 'connected' && (
            <div className="space-y-2">
              <Input
                placeholder="Janus Server URL"
                value={serverUrl}
                onChange={e => setServerUrl(e.target.value)}
              />
              <Button onClick={handleConnect} className="w-full">Connect to Server</Button>
            </div>
          )}
          
          {/* SIP Registration */}
          {connectionState === 'connected' && registrationState !== 'registered' && (
            <div className="space-y-2">
              <Input
                placeholder="SIP Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
              <Input
                placeholder="SIP Password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <Input
                placeholder="SIP Host"
                value={sipHost}
                onChange={e => setSipHost(e.target.value)}
              />
              <Button onClick={handleRegister} className="w-full">Register</Button>
            </div>
          )}
          
          {/* Incoming Call */}
          {isIncomingCall && (
            <div className="bg-blue-100 p-4 rounded">
              <div className="text-center mb-2">Incoming call from {incomingCallFrom}</div>
              <div className="flex justify-center space-x-2">
                <Button onClick={handleAcceptCall} className="bg-green-500">Answer</Button>
                <Button onClick={hangup} variant="destructive">Decline</Button>
              </div>
            </div>
          )}
          
          {/* Dialer */}
          {registrationState === 'registered' && !isIncomingCall && (
            <div className="space-y-2">
              <Input
                placeholder="Enter number to call"
                value={number}
                onChange={e => setNumber(e.target.value)}
                disabled={callState !== 'idle' && callState !== 'ended'}
              />
              <div className="flex space-x-2">
                <Button 
                  onClick={handleCall} 
                  className={callState !== 'idle' && callState !== 'ended' ? 'bg-red-500 flex-1' : 'bg-green-500 flex-1'}
                >
                  {callState !== 'idle' && callState !== 'ended' ? <PhoneOff /> : <Phone />}
                  {callState !== 'idle' && callState !== 'ended' ? ' Hang Up' : ' Call'}
                </Button>
                <Button onClick={toggleMute} variant="outline">
                  {muted ? <MicOff /> : <Mic />}
                </Button>
                <Button variant="outline">
                  <Video />
                </Button>
              </div>
            </div>
          )}
          
          {/* Media Elements (hidden) */}
          <div className="hidden">
            <video ref={localVideoRef} autoPlay playsInline muted />
            <video ref={remoteVideoRef} autoPlay playsInline />
            <audio ref={remoteAudioRef} autoPlay />
          </div>
        </CardContent>
        <CardFooter>
          <div className="text-xs text-gray-500">
            Based on Janus WebRTC Gateway
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SipPhone;
