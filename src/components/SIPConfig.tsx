
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

const SIPConfig = () => {
  return (
    <div className="w-full max-w-lg mx-auto p-6">
      <h2 className="text-xl font-semibold mb-6">SIP Account Settings</h2>
      
      <Card>
        <CardHeader>
          <CardTitle>SIP Account</CardTitle>
          <CardDescription>Configure your SIP account credentials</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="display-name">Display Name</Label>
            <Input id="display-name" placeholder="John Doe" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="username">SIP Username</Label>
            <Input id="username" placeholder="username" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">SIP Password</Label>
            <Input id="password" type="password" placeholder="••••••••" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="domain">SIP Domain</Label>
            <Input id="domain" placeholder="sip.example.com" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="proxy">Outbound Proxy (optional)</Label>
            <Input id="proxy" placeholder="proxy.example.com" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="port">Port</Label>
            <Input id="port" placeholder="5060" type="number" />
          </div>
        </CardContent>
      </Card>
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Advanced Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base" htmlFor="use-stun">Use STUN</Label>
              <p className="text-sm text-gray-500">
                Enable STUN for NAT traversal
              </p>
            </div>
            <Switch id="use-stun" />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base" htmlFor="use-ice">ICE</Label>
              <p className="text-sm text-gray-500">
                Enable Interactive Connectivity Establishment
              </p>
            </div>
            <Switch id="use-ice" />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base" htmlFor="auto-register">Auto Register</Label>
              <p className="text-sm text-gray-500">
                Automatically register on startup
              </p>
            </div>
            <Switch id="auto-register" defaultChecked />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline">Cancel</Button>
          <Button className="bg-softphone-primary hover:bg-blue-700">Save Settings</Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SIPConfig;
