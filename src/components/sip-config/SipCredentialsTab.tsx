
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import janusService from "@/services/JanusService";

const SipCredentialsTab = () => {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const sipHost = "hpbx.voicehost.co.uk:5060";

  const handleSave = async () => {
    if (!username || !password) {
      toast({
        title: "Error",
        description: "Please enter both username and password",
        variant: "destructive",
      });
      return;
    }

    try {
      // Initialize Janus with SIP credentials
      await janusService.initialize({
        server: 'wss://devrtc.voicehost.io:443/janus',
        apiSecret: 'overlord',
        success: async () => {
          // Register with SIP credentials after Janus is initialized
          await janusService.register(username);
          toast({
            title: "Success",
            description: "SIP credentials saved and connected",
          });
        },
        error: (error) => {
          toast({
            title: "Connection Error",
            description: error,
            variant: "destructive",
          });
        }
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save SIP credentials",
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
        <div className="space-y-2">
          <Label htmlFor="sipHost">SIP Host</Label>
          <Input id="sipHost" value={sipHost} disabled />
        </div>
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your SIP username"
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
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave}>Save & Connect</Button>
      </CardFooter>
    </Card>
  );
};

export default SipCredentialsTab;
