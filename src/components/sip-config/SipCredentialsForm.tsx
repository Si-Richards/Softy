
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Info, Lock } from "lucide-react";

interface SipCredentialsFormProps {
  username: string;
  setUsername: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  handleSave: () => void;
  isDisabled: boolean;
  isReadOnly?: boolean;
  buttonText: string;
  sipHost?: string;
  setSipHost?: (value: string) => void;
}

const SipCredentialsForm: React.FC<SipCredentialsFormProps> = ({
  username,
  setUsername,
  password,
  setPassword,
  handleSave,
  isDisabled,
  isReadOnly = false,
  buttonText,
  sipHost,
  setSipHost
}) => {
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave();
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">SIP Identity</Label>
        <div className="relative">
          <Input 
            id="username" 
            value={username} 
            onChange={e => setUsername(e.target.value)} 
            placeholder="Enter your SIP identity (e.g., 16331*201)" 
            disabled={isDisabled || isReadOnly} 
            className={isReadOnly ? "bg-gray-100" : ""} 
            readOnly={isReadOnly} 
          />
          <div className="absolute right-3 top-2 text-gray-400">
            <Info size={16} className="hover:text-blue-500 cursor-help" />
          </div>
        </div>
        <p className="text-xs text-gray-500">
          Format: extension (e.g., "16331*201") or full SIP URI (e.g., "16331*201@hpbx.voicehost.co.uk")
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Secret</Label>
        <div className="relative">
          <Input 
            id="password" 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            placeholder="Enter your SIP password/secret" 
            disabled={isDisabled || isReadOnly} 
            className={isReadOnly ? "bg-gray-100" : ""} 
            readOnly={isReadOnly} 
          />
          <div className="absolute right-3 top-2 text-gray-400">
            <Lock size={16} />
          </div>
        </div>
      </div>
      
      {setSipHost && (
        <div className="space-y-2">
          <Label htmlFor="host">SIP Registrar</Label>
          <Input 
            id="host" 
            value={sipHost} 
            onChange={e => setSipHost(e.target.value)} 
            placeholder="SIP Server Address" 
            disabled={isDisabled || isReadOnly} 
            className={isReadOnly ? "bg-gray-100" : ""} 
            readOnly={isReadOnly} 
          />
          <p className="text-xs text-gray-500">
            Format: hostname:port (e.g., "hpbx.voicehost.co.uk:5060")
          </p>
        </div>
      )}
      
      <div className="pt-4">
        <Button 
          type="submit" 
          disabled={isDisabled || !username || !password} 
          className="w-full sm:w-auto"
        >
          {buttonText}
        </Button>
      </div>
    </form>
  );
};

export default SipCredentialsForm;
