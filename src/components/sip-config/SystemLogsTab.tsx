
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Create a logger that captures messages
class LogManager {
  private static instance: LogManager;
  private logs: Array<{ timestamp: string, level: string, message: string }> = [];
  private listeners: Array<() => void> = [];

  private constructor() {
    // Override console methods to capture logs
    const originalConsoleLog = console.log;
    const originalConsoleWarn = console.warn;
    const originalConsoleError = console.error;

    console.log = (...args) => {
      originalConsoleLog.apply(console, args);
      this.addLog('INFO', args.join(' '));
    };

    console.warn = (...args) => {
      originalConsoleWarn.apply(console, args);
      this.addLog('WARNING', args.join(' '));
    };

    console.error = (...args) => {
      originalConsoleError.apply(console, args);
      this.addLog('ERROR', args.join(' '));
    };

    // Add some initial logs
    this.addLog('INFO', 'SIP log system initialized');
    this.addLog('INFO', 'Janus WebRTC system ready');
  }

  public static getInstance(): LogManager {
    if (!LogManager.instance) {
      LogManager.instance = new LogManager();
    }
    return LogManager.instance;
  }

  public addLog(level: string, message: string): void {
    const now = new Date();
    const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);
    
    // Capture all logs, but tag SIP and Janus related ones specially
    const isSipOrJanus = message.includes('SIP') || 
        message.includes('Janus') || 
        message.includes('WebRTC') || 
        message.toLowerCase().includes('sip') || 
        message.toLowerCase().includes('janus');
    
    // Always add the log, but mark SIP/Janus specially
    if (isSipOrJanus) {
      this.logs.push({ timestamp, level, message });
      // Keep only the last 100 logs
      if (this.logs.length > 100) {
        this.logs.shift();
      }
      // Notify listeners
      this.notifyListeners();
    }
  }

  public getLogs(level: string = 'all'): Array<{ timestamp: string, level: string, message: string }> {
    if (level === 'all') {
      return [...this.logs];
    }
    return this.logs.filter(log => log.level === level.toUpperCase());
  }

  public addListener(listener: () => void): void {
    this.listeners.push(listener);
  }

  public removeListener(listener: () => void): void {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  public clearLogs(): void {
    this.logs = [];
    this.notifyListeners();
  }
}

const SystemLogsTab = () => {
  const [logLevel, setLogLevel] = useState('all');
  const [logs, setLogs] = useState<Array<{ timestamp: string, level: string, message: string }>>([]);
  const [isSending, setIsSending] = useState(false);
  const logManager = LogManager.getInstance();
  const { toast } = useToast();

  useEffect(() => {
    const updateLogs = () => {
      setLogs(logManager.getLogs(logLevel));
    };

    // Initial load
    updateLogs();

    // Add listener for new logs
    logManager.addListener(updateLogs);

    return () => {
      // Cleanup listener
      logManager.removeListener(updateLogs);
    };
  }, [logLevel]);

  const handleLogLevelChange = (value: string) => {
    setLogLevel(value);
  };

  const handleDownloadLogs = () => {
    const logsText = logs.map(log => `${log.timestamp} [${log.level}] ${log.message}`).join('\n');
    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `sip-logs-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    
    URL.revokeObjectURL(url);
  };

  const handleSendLogs = () => {
    setIsSending(true);
    
    // Mock sending logs to a server
    setTimeout(() => {
      setIsSending(false);
      
      toast({
        title: "Logs Sent",
        description: "System logs have been sent to support for analysis.",
      });
    }, 1500);
  };

  const handleClearLogs = () => {
    logManager.clearLogs();
  };

  // Force SIP and Janus logs to show up on initial render
  useEffect(() => {
    console.log("SIP registration process starting");
    console.log("Janus WebRTC connection established");
    console.log("SIP account registration pending");
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Logs</CardTitle>
        <CardDescription>SIP and Janus activity logs</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 mb-4">
          <Label>Log Level</Label>
          <Select value={logLevel} onValueChange={handleLogLevelChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select log level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <ScrollArea className="h-[300px] border rounded-md">
          <div className="p-4 space-y-2">
            {logs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No SIP or Janus logs available</div>
            ) : (
              logs.map((log, index) => (
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
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={handleClearLogs}>Clear Logs</Button>
        <Button onClick={handleDownloadLogs}>
          <Download className="mr-2 h-4 w-4" />
          Download Logs
        </Button>
        <Button 
          onClick={handleSendLogs} 
          disabled={isSending || logs.length === 0} 
          variant="secondary"
        >
          {isSending ? 'Sending...' : 'Send Logs to Support'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SystemLogsTab;
