
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { FileCog, Mic, Shield, Volume2 } from "lucide-react";

const SIPConfig = () => {
  const [noiseCancellation, setNoiseCancellation] = useState(true);
  const [echoSuppression, setEchoSuppression] = useState(true);
  const [autoGainControl, setAutoGainControl] = useState(true);
  const [highPassFilter, setHighPassFilter] = useState(false);
  
  const logsData = [
    { timestamp: "2025-04-17 09:15:23", level: "INFO", message: "Application started" },
    { timestamp: "2025-04-17 09:15:24", level: "INFO", message: "Checking audio devices" },
    { timestamp: "2025-04-17 09:15:25", level: "INFO", message: "Audio initialized successfully" },
    { timestamp: "2025-04-17 09:16:30", level: "WARNING", message: "Network connectivity unstable" },
    { timestamp: "2025-04-17 09:18:45", level: "INFO", message: "Network connection restored" },
    { timestamp: "2025-04-17 09:20:12", level: "INFO", message: "Call session initialized" },
    { timestamp: "2025-04-17 09:25:37", level: "INFO", message: "Call ended: duration 05:25" },
    { timestamp: "2025-04-17 09:30:01", level: "ERROR", message: "Failed to connect to server" },
    { timestamp: "2025-04-17 09:31:15", level: "INFO", message: "Reconnection attempt successful" },
    { timestamp: "2025-04-17 09:45:22", level: "INFO", message: "Call session initialized" },
  ];

  return (
    <div className="w-full max-w-lg mx-auto p-6">
      <h2 className="text-xl font-semibold mb-6">Settings</h2>
      
      <Tabs defaultValue="audio">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="audio">Audio Enhancement</TabsTrigger>
          <TabsTrigger value="logs">System Logs</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>
        
        <TabsContent value="audio">
          <Card>
            <CardHeader>
              <CardTitle>Audio Enhancement</CardTitle>
              <CardDescription>Configure audio processing settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base" htmlFor="noise-cancellation">Noise Cancellation</Label>
                  <p className="text-sm text-gray-500">
                    Reduce background noise during calls
                  </p>
                </div>
                <Switch 
                  id="noise-cancellation" 
                  checked={noiseCancellation} 
                  onCheckedChange={setNoiseCancellation} 
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base" htmlFor="echo-suppression">Echo Suppression</Label>
                  <p className="text-sm text-gray-500">
                    Prevent audio echo during calls
                  </p>
                </div>
                <Switch 
                  id="echo-suppression" 
                  checked={echoSuppression} 
                  onCheckedChange={setEchoSuppression} 
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base" htmlFor="gain-control">Auto Gain Control</Label>
                  <p className="text-sm text-gray-500">
                    Automatically adjust microphone sensitivity
                  </p>
                </div>
                <Switch 
                  id="gain-control" 
                  checked={autoGainControl} 
                  onCheckedChange={setAutoGainControl} 
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base" htmlFor="high-pass">High Pass Filter</Label>
                  <p className="text-sm text-gray-500">
                    Remove low frequency noise
                  </p>
                </div>
                <Switch 
                  id="high-pass" 
                  checked={highPassFilter} 
                  onCheckedChange={setHighPassFilter} 
                />
              </div>
              
              <div className="space-y-2 pt-4">
                <Label htmlFor="noise-level">Noise Reduction Level</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Low</span>
                  <Slider
                    id="noise-level"
                    defaultValue={[3]}
                    max={5}
                    min={1}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-500">High</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>System Logs</CardTitle>
              <CardDescription>Recent system activity and events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <Label>Log Level</Label>
                <Select defaultValue="info">
                  <SelectTrigger>
                    <SelectValue placeholder="Select log level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="debug">Debug</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <ScrollArea className="h-[300px] border rounded-md">
                <div className="p-4 space-y-2">
                  {logsData.map((log, index) => (
                    <div 
                      key={index} 
                      className={`text-sm py-1 px-2 rounded ${
                        log.level === "ERROR" ? "bg-red-50 text-red-800" :
                        log.level === "WARNING" ? "bg-yellow-50 text-yellow-800" :
                        "bg-gray-50 text-gray-800"
                      }`}
                    >
                      <span className="font-mono">{log.timestamp}</span> [{log.level}] {log.message}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">Download Logs</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="about">
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
              <CardDescription>Software information and version details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">My Company Softphone</h3>
                <p className="text-sm text-gray-500">Enterprise Communication Solution</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-sm font-medium">Version</p>
                  <p className="text-sm text-gray-500">2.5.1</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Build Number</p>
                  <p className="text-sm text-gray-500">25045-rc2</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Release Date</p>
                  <p className="text-sm text-gray-500">April 15, 2025</p>
                </div>
                <div>
                  <p className="text-sm font-medium">License</p>
                  <p className="text-sm text-gray-500">Enterprise</p>
                </div>
              </div>
              
              <div className="pt-4">
                <h4 className="text-sm font-medium">System Information</h4>
                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                  <p className="text-gray-500">Platform</p>
                  <p>Web Browser</p>
                  <p className="text-gray-500">Operating System</p>
                  <p>Detected at Runtime</p>
                  <p className="text-gray-500">WebRTC Support</p>
                  <p>Enabled</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" size="sm">Check for Updates</Button>
              <Button size="sm">Support</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SIPConfig;
