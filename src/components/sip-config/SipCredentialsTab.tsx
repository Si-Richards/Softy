
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useSipConnection } from "@/hooks/useSipConnection";
import SipConnectionStatus from "./SipConnectionStatus";
import SipCredentialsForm from "./SipCredentialsForm";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const SipCredentialsTab: React.FC = () => {
  const {
    username,
    setUsername,
    password,
    setPassword,
    sipHost,
    setSipHost,
    isLoading,
    registrationStatus,
    errorMessage,
    progressValue,
    handleSave,
    handleForgetCredentials
  } = useSipConnection();

  const isFormDisabled = isLoading || registrationStatus === "connecting";
  const isRegistered = registrationStatus === "connected";
  
  const buttonText = isLoading 
    ? "Connecting..." 
    : isRegistered
      ? "Reconnect" 
      : "Save & Connect";

  // Pre-fill with VoiceHost example credentials
  const fillExampleCredentials = () => {
    setUsername("16331*201");
    setPassword("am4tsQwM53YYT!cw");
    setSipHost("hpbx.voicehost.co.uk:5060");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>SIP Credentials</CardTitle>
        <CardDescription>Enter your SIP account credentials</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection type notice */}
        <Alert className="bg-blue-50 border-blue-200">
          <AlertDescription className="text-blue-800">
            <strong>Connection Info:</strong> Using UDP on port 5060 for SIP traffic
          </AlertDescription>
        </Alert>
        
        <SipConnectionStatus 
          status={registrationStatus}
          errorMessage={errorMessage}
          progressValue={progressValue}
          isLoading={isLoading}
        />
        
        <SipCredentialsForm
          username={username}
          setUsername={setUsername}
          password={password}
          setPassword={setPassword}
          sipHost={sipHost}
          setSipHost={setSipHost}
          handleSave={handleSave}
          isDisabled={isFormDisabled}
          isReadOnly={isRegistered}
          buttonText={buttonText}
        />
        
        <div className="flex flex-wrap gap-2">
          {!isRegistered && (
            <Button
              onClick={fillExampleCredentials}
              variant="secondary"
              type="button"
              className="w-full sm:w-auto"
            >
              Use Example Credentials
            </Button>
          )}
          
          {isRegistered && (
            <Button 
              onClick={handleForgetCredentials}
              variant="outline"
              className="w-full sm:w-auto"
            >
              Forget Me
            </Button>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <p className="text-xs text-gray-500">
          For VoiceHost SIP, use identity format: [user]@hpbx.voicehost.co.uk
        </p>
      </CardFooter>
    </Card>
  );
};

export default SipCredentialsTab;
