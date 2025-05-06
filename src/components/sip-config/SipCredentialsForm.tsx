
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SipCredentialsFormProps {
  username: string;
  setUsername: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  handleSave: () => void;
  isDisabled: boolean;
  buttonText: string;
}

const SipCredentialsForm: React.FC<SipCredentialsFormProps> = ({
  username,
  setUsername,
  password,
  setPassword,
  handleSave,
  isDisabled,
  buttonText
}) => {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your SIP username"
          disabled={isDisabled}
        />
        <p className="text-xs text-gray-500">
          Enter only your SIP username (e.g., "16331*201")
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your SIP password"
          disabled={isDisabled}
        />
      </div>
      <div className="pt-4">
        <Button 
          onClick={handleSave} 
          disabled={isDisabled || !username || !password}
          className="w-full sm:w-auto"
        >
          {buttonText}
        </Button>
      </div>
    </>
  );
};

export default SipCredentialsForm;
