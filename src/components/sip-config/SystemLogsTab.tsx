
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

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

const SystemLogsTab = () => (
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
);

export default SystemLogsTab;
