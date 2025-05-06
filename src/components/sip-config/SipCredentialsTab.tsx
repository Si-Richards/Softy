
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useSipConnection } from "@/hooks/useSipConnection";
import SipConnectionStatus from "./SipConnectionStatus";
import SipCredentialsForm from "./SipCredentialsForm";
import { Button } from "@/components/ui/button";

const SipCredentialsTab: React.FC = () => {
  const {
    username,
    setUsername,
    password,
    setPassword,
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>SIP Credentials</CardTitle>
        <CardDescription>Enter your SIP account credentials</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
          handleSave={handleSave}
          isDisabled={isFormDisabled}
          isReadOnly={isRegistered}
          buttonText={buttonText}
        />
        
        {isRegistered && (
          <div className="pt-2">
            <Button 
              onClick={handleForgetCredentials}
              variant="outline"
              className="w-full sm:w-auto"
            >
              Forget Me
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        {/* CardFooter is kept for potential future additions */}
      </CardFooter>
    </Card>
  );
};

export default SipCredentialsTab;
