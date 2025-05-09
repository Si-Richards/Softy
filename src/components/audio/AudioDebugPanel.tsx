
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Volume, Volume1, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import audioService from "@/services/AudioService";
import userInteractionService from "@/services/UserInteractionService";

interface AudioDebugPanelProps {
  visible?: boolean;
}

const AudioDebugPanel: React.FC<AudioDebugPanelProps> = ({ visible = false }) => {
  const [isVisible, setIsVisible] = useState(visible);
  const [audioStatus, setAudioStatus] = useState<any>({});
  const [audioLevel, setAudioLevel] = useState(0);
  const [userInteraction, setUserInteraction] = useState(userInteractionService.userHasInteracted());
  const [showRawStats, setShowRawStats] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    // Toggle debug mode in UserInteractionService based on panel visibility
    userInteractionService.setDebugMode(isVisible);
    
    // Initialize status polling when panel is visible
    if (isVisible) {
      statusIntervalRef.current = setInterval(() => {
        const status = audioService.getAudioStatus();
        setAudioStatus(status);
        setUserInteraction(userInteractionService.userHasInteracted());
      }, 1000);
      
      // Start audio visualization
      startAudioVisualization();
    } else {
      // Clean up when hidden
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
        statusIntervalRef.current = null;
      }
      
      // Stop audio visualization
      stopAudioVisualization();
    }
    
    return () => {
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
      }
      stopAudioVisualization();
    };
  }, [isVisible]);
  
  const startAudioVisualization = () => {
    if (!canvasRef.current || animationRef.current) return;
    
    const drawVisualization = () => {
      const level = audioService.getAudioLevel();
      setAudioLevel(level);
      
      // Draw visualization
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const width = canvas.width;
          const height = canvas.height;
          
          // Clear canvas
          ctx.clearRect(0, 0, width, height);
          
          // Draw background
          ctx.fillStyle = '#f1f5f9'; // slate-100
          ctx.fillRect(0, 0, width, height);
          
          // Draw level meter
          const meterWidth = Math.min(width * level, width);
          const gradient = ctx.createLinearGradient(0, 0, width, 0);
          gradient.addColorStop(0, '#10b981'); // green-500
          gradient.addColorStop(0.6, '#eab308'); // yellow-500
          gradient.addColorStop(1, '#ef4444'); // red-500
          
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, meterWidth, height);
          
          // Draw grid lines
          ctx.strokeStyle = '#94a3b8'; // slate-400
          ctx.lineWidth = 1;
          
          // Vertical grid lines at 25%, 50%, 75%
          [0.25, 0.5, 0.75].forEach(pos => {
            const x = Math.floor(width * pos) + 0.5;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
          });
        }
      }
      
      animationRef.current = requestAnimationFrame(drawVisualization);
    };
    
    animationRef.current = requestAnimationFrame(drawVisualization);
  };
  
  const stopAudioVisualization = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };
  
  const handleForcePlay = () => {
    audioService.forcePlayAudio()
      .then(success => console.log("Manual force play result:", success))
      .catch(err => console.error("Manual force play error:", err));
  };
  
  const handleToggleControls = () => {
    if (audioStatus.controlsVisible) {
      audioService.hideAudioControls();
    } else {
      audioService.showAudioControls();
    }
  };
  
  const handleForceInteraction = () => {
    userInteractionService.forceInteractionState(true);
    setUserInteraction(true);
  };
  
  const getStatusColor = (isActive: boolean) => {
    return isActive ? "bg-green-500" : "bg-red-500";
  };
  
  const getVolumeIcon = () => {
    if (audioStatus?.volume === 0 || audioStatus?.muted) return <VolumeX className="h-4 w-4" />;
    if (audioStatus?.volume < 0.3) return <Volume className="h-4 w-4" />;
    if (audioStatus?.volume < 0.7) return <Volume1 className="h-4 w-4" />;
    return <Volume2 className="h-4 w-4" />;
  };

  if (!isVisible) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="fixed bottom-2 right-2 z-50 opacity-50 hover:opacity-100"
        onClick={() => setIsVisible(true)}
      >
        Show Audio Debug
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-2 right-2 w-96 z-50 shadow-lg bg-white/90 backdrop-blur">
      <CardHeader className="py-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-medium">Audio Debug Panel</CardTitle>
          <Button size="sm" variant="ghost" onClick={() => setIsVisible(false)} className="h-7 w-7 p-0">
            ×
          </Button>
        </div>
      </CardHeader>
      <CardContent className="py-2 space-y-3 text-xs">
        <div className="flex justify-between">
          <div className="space-x-1">
            <Badge className={getStatusColor(userInteraction)}>
              {userInteraction ? "User Interaction: Yes" : "User Interaction: No"}
            </Badge>
            <Badge className={getStatusColor(!!audioStatus?.hasAudioTracks)}>
              {audioStatus?.hasAudioTracks ? `Tracks: ${audioStatus.hasAudioTracks}` : "No Tracks"}
            </Badge>
          </div>
          <div className="space-x-1">
            <Badge className={getStatusColor(!audioStatus?.paused)}>
              {audioStatus?.paused ? "Paused" : "Playing"}
            </Badge>
            <Badge variant="outline" className="flex items-center">
              {getVolumeIcon()} {audioStatus?.volume !== undefined ? Math.round(audioStatus.volume * 100) : '--'}%
            </Badge>
          </div>
        </div>

        <div>
          <p className="mb-1">Audio Level:</p>
          <canvas 
            ref={canvasRef} 
            width={360} 
            height={20} 
            className="w-full h-5 bg-slate-100 rounded border border-slate-300"
          />
          <div className="flex justify-between mt-1 text-[10px] text-slate-500">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button size="sm" className="text-xs" onClick={handleForcePlay}>
            Force Play
          </Button>
          <Button size="sm" className="text-xs" onClick={handleToggleControls}>
            {audioStatus?.controlsVisible ? "Hide Controls" : "Show Controls"}
          </Button>
          <Button 
            size="sm" 
            className="text-xs"
            disabled={userInteraction}
            onClick={handleForceInteraction}
          >
            Force Interaction
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="show-raw-stats"
            checked={showRawStats}
            onCheckedChange={setShowRawStats}
          />
          <Label htmlFor="show-raw-stats">Show Raw Stats</Label>
        </div>

        {showRawStats && (
          <pre className="text-[10px] bg-slate-100 p-2 rounded max-h-32 overflow-auto">
            {JSON.stringify(audioStatus, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  );
};

export default AudioDebugPanel;
