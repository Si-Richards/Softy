
import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const AboutTab = () => {
  const [browserInfo, setBrowserInfo] = useState({
    name: "Unknown",
    version: "Unknown",
    os: "Unknown"
  });

  useEffect(() => {
    // Get browser information
    const userAgent = navigator.userAgent;
    let browserName = "Unknown";
    let browserVersion = "Unknown";
    let os = "Unknown";

    // Detect browser
    if (userAgent.indexOf("Firefox") > -1) {
      browserName = "Mozilla Firefox";
    } else if (userAgent.indexOf("SamsungBrowser") > -1) {
      browserName = "Samsung Internet";
    } else if (userAgent.indexOf("Opera") > -1 || userAgent.indexOf("OPR") > -1) {
      browserName = "Opera";
    } else if (userAgent.indexOf("Trident") > -1) {
      browserName = "Internet Explorer";
    } else if (userAgent.indexOf("Edge") > -1) {
      browserName = "Microsoft Edge (Legacy)";
    } else if (userAgent.indexOf("Edg") > -1) {
      browserName = "Microsoft Edge (Chromium)";
    } else if (userAgent.indexOf("Chrome") > -1) {
      browserName = "Google Chrome";
    } else if (userAgent.indexOf("Safari") > -1) {
      browserName = "Safari";
    }

    // Detect OS
    if (userAgent.indexOf("Win") > -1) {
      os = "Windows";
    } else if (userAgent.indexOf("Mac") > -1) {
      os = "macOS";
    } else if (userAgent.indexOf("Linux") > -1) {
      os = "Linux";
    } else if (userAgent.indexOf("Android") > -1) {
      os = "Android";
    } else if (userAgent.indexOf("iOS") > -1 || userAgent.indexOf("iPhone") > -1 || userAgent.indexOf("iPad") > -1) {
      os = "iOS";
    }

    // Try to extract version - this is a simplified approach
    const versionMatch = userAgent.match(/(firefox|chrome|safari|opr|opera|version)\/?\s*(\d+(\.\d+)?)/i);
    if (versionMatch && versionMatch[2]) {
      browserVersion = versionMatch[2];
    }

    setBrowserInfo({
      name: browserName,
      version: browserVersion,
      os: os
    });
  }, []);

  return <Card>
    <CardHeader>
      <CardTitle>About</CardTitle>
      <CardDescription>Software information and version details</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">VoiceHost Softphone Application</h3>
        <p className="text-sm text-gray-500">Enterprise Communication Solutions</p>
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
          <p className="text-gray-500">Browser</p>
          <p>{browserInfo.name} {browserInfo.version}</p>
          <p className="text-gray-500">Operating System</p>
          <p>{browserInfo.os}</p>
          <p className="text-gray-500">WebRTC Support</p>
          <p>{navigator.mediaDevices ? "Enabled" : "Not Available"}</p>
        </div>
      </div>
    </CardContent>
    <CardFooter className="flex justify-between">
      <Button variant="outline" size="sm">Check for Updates</Button>
      <Button size="sm">Support</Button>
    </CardFooter>
  </Card>;
};

export default AboutTab;
