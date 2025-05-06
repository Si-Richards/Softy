
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
  // Set the default SIP host but keep it hidden from UI
  const [sipHost, setSipHost] = useState("hpbx08.tw140-l6.lon.gb.voicehost.co.uk:5060");
  const [isLoading, setIsLoading] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<"idle" | "connecting" | "connected" | "failed">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Set up error handler
    janusService.setOnError((error) => {
      console.error("SIP Error in handler:", error);
      setErrorMessage(error);
      setRegistrationStatus("failed");
      setIsLoading(false);
      toast({
        title: "Registration Error",
        description: error,
        variant: "destructive",
      });
    });

    // Cleanup when component unmounts
    return () => {
      // Clear error handler
      janusService.setOnError(() => {});
    };
  }, []);

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
            console.log(`Attempting to register with username: ${username}, host: ${sipHost}`);
            // After successful initialization, register with SIP credentials
            await janusService.register(username, password, sipHost);
            
            // We don't immediately set connected because the actual registration happens asynchronously
            // The status is updated in the event handler in JanusService
            
            setIsLoading(false);
            
            // Check if registration was successful after a short delay
            setTimeout(() => {
              if (janusService.isRegistered()) {
                setRegistrationStatus("connected");
                toast({
                  title: "Registration Successful",
                  description: "SIP credentials saved and connected",
                });
              } else {
                // If not registered after a delay, show an error
                setRegistrationStatus("failed");
                setErrorMessage("Registration timed out. Please check your credentials and try again.");
              }
            }, 1500);
          } catch (error: any) {
            setRegistrationStatus("failed");
            setIsLoading(false);
            const errorMsg = `Registration error: ${error.message || error}`;
            console.error(errorMsg);
            setErrorMessage(errorMsg);
            toast({
              title: "Registration Failed",
              description: errorMsg,
              variant: "destructive",
            });
          }
        },
        error: (error) => {
          setRegistrationStatus("failed");
          setIsLoading(false);
          const errorMsg = `Connection error: ${error}`;
          console.error(errorMsg);
          setErrorMessage(errorMsg);
          toast({
            title: "Connection Error",
            description: errorMsg,
            variant: "destructive",
          });
        }
      });
    } catch (error: any) {
      setRegistrationStatus("failed");
      setIsLoading(false);
      const errorMsg = `Error: ${error.message || error}`;
      console.error(errorMsg);
      setErrorMessage(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
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
        {/* SIP Host field is hidden as requested */}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSave} 
          disabled={isLoading || registrationStatus === "connecting" || !username || !password}
        >
          {isLoading ? "Connecting..." : registrationStatus === "connected" ? "Reconnect" : "Save & Connect"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SipCredentialsTab;
