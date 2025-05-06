
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import janusService from "@/services/JanusService";

const SipCredentialsTab = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [sipHost, setSipHost] = useState("hpbx.voicehost.co.uk:5060");
  const [isLoading, setIsLoading] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<"idle" | "connecting" | "connected" | "failed">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [registrationCheckInterval, setRegistrationCheckInterval] = useState<number | null>(null);

  useEffect(() => {
    // Set up error handler
    janusService.setOnError((error) => {
      setErrorMessage(error);
      if (error.includes("registration")) {
        setRegistrationStatus("failed");
        setIsLoading(false);
      }
      toast({
        title: "Registration Error",
        description: error,
        variant: "destructive",
      });
    });

    // Check if we're already registered
    if (janusService.isRegistered()) {
      setRegistrationStatus("connected");
    }

    // Set up periodic registration check
    const intervalId = window.setInterval(() => {
      if (janusService.isRegistered()) {
        setRegistrationStatus("connected");
      } else if (registrationStatus === "connected") {
        setRegistrationStatus("failed");
        toast({
          title: "Registration Lost",
          description: "Connection to SIP server was lost",
          variant: "destructive",
        });
      }
    }, 5000);

    setRegistrationCheckInterval(intervalId);

    // Cleanup when component unmounts
    return () => {
      // Clear error handler
      janusService.setOnError(() => {});
      // Clear interval
      if (registrationCheckInterval) {
        clearInterval(registrationCheckInterval);
      }
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [registrationStatus]);

  const handleSave = async () => {
    // Form validation
    if (!username || !password) {
      toast({
        title: "Validation Error",
        description: "Please enter both username and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setRegistrationStatus("connecting");
    setErrorMessage(null);

    try {
      // Initialize Janus first
      await janusService.initialize({
        server: 'wss://devrtc.voicehost.io:443/janus',
        apiSecret: 'overlord',
        success: async () => {
          try {
            // After successful initialization, register with SIP credentials
            await janusService.register(username, password, sipHost);
            
            // We don't immediately set connected because the actual registration happens asynchronously
            // Periodically check registration status
            let attempts = 0;
            const checkRegistration = setInterval(() => {
              attempts++;
              if (janusService.isRegistered()) {
                setRegistrationStatus("connected");
                setIsLoading(false);
                clearInterval(checkRegistration);
                toast({
                  title: "Registration Successful",
                  description: "SIP credentials saved and connected",
                });
              } else if (attempts >= 10) {
                // After 10 attempts (5 seconds), give up
                setRegistrationStatus("failed");
                setIsLoading(false);
                setErrorMessage("Failed to confirm registration status");
                clearInterval(checkRegistration);
                toast({
                  title: "Registration Failed",
                  description: "Failed to confirm SIP registration status",
                  variant: "destructive",
                });
              }
            }, 500);
            
          } catch (error) {
            setRegistrationStatus("failed");
            setIsLoading(false);
            setErrorMessage(`Registration error: ${error}`);
            toast({
              title: "Registration Failed",
              description: `Failed to register with SIP server: ${error}`,
              variant: "destructive",
            });
          }
        },
        error: (error) => {
          setRegistrationStatus("failed");
          setIsLoading(false);
          setErrorMessage(`Connection error: ${error}`);
          toast({
            title: "Connection Error",
            description: `Failed to connect to WebRTC server: ${error}`,
            variant: "destructive",
          });
        }
      });
    } catch (error) {
      setRegistrationStatus("failed");
      setIsLoading(false);
      setErrorMessage(`Error: ${error}`);
      toast({
        title: "Error",
        description: `Failed to initialize WebRTC: ${error}`,
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>SIP Credentials</CardTitle>
        <CardDescription>Enter your SIP account credentials</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Registration Failed</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        
        {registrationStatus === "connecting" && (
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-xs">
              <span>Connecting to SIP server...</span>
              <span>{isLoading ? "Please wait" : ""}</span>
            </div>
            <Progress value={isLoading ? 50 : 100} />
          </div>
        )}
        
        {registrationStatus === "connected" && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <AlertTitle>Connected</AlertTitle>
            <AlertDescription>Successfully registered with SIP server</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="sipHost">SIP Host</Label>
          <Input 
            id="sipHost" 
            value={sipHost} 
            onChange={(e) => setSipHost(e.target.value)}
            placeholder="Enter SIP host (e.g. example.com:5060)"
            disabled={isLoading || registrationStatus === "connecting"}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your SIP username"
            disabled={isLoading || registrationStatus === "connecting"}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your SIP password"
            disabled={isLoading || registrationStatus === "connecting"}
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          onClick={handleSave} 
          disabled={isLoading || registrationStatus === "connecting" || !username || !password}
        >
          {isLoading ? "Connecting..." : registrationStatus === "connected" ? "Reconnect" : "Save & Connect"}
        </Button>
        
        {registrationStatus === "connected" && (
          <Button 
            variant="outline" 
            onClick={() => {
              janusService.unregister().then(() => {
                setRegistrationStatus("idle");
                toast({
                  title: "Unregistered",
                  description: "Successfully unregistered from SIP server",
                });
              }).catch(error => {
                toast({
                  title: "Error",
                  description: `Failed to unregister: ${error}`,
                  variant: "destructive",
                });
              });
            }}
          >
            Unregister
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default SipCredentialsTab;
