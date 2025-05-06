
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { SipConnectionStatus } from "@/hooks/useSipConnection";

interface SipConnectionStatusProps {
  status: SipConnectionStatus;
  errorMessage: string | null;
  progressValue: number;
  isLoading: boolean;
}

const SipConnectionStatus: React.FC<SipConnectionStatusProps> = ({
  status,
  errorMessage,
  progressValue,
  isLoading
}) => {
  return (
    <>
      {errorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Registration Failed</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      
      {status === "connecting" && (
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-xs">
            <span>Connecting to SIP server...</span>
            <span>{isLoading ? `${progressValue}%` : ""}</span>
          </div>
          <Progress value={progressValue} />
        </div>
      )}
      
      {status === "connected" && (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <AlertTitle>Connected</AlertTitle>
          <AlertDescription>Successfully registered with SIP server</AlertDescription>
        </Alert>
      )}
    </>
  );
};

export default SipConnectionStatus;
