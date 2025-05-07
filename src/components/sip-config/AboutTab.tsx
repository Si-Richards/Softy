
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const AboutTab = () => (
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
);

export default AboutTab;
