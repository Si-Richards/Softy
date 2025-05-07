
import { ReactNode } from "react";

export type PresenceStatus = "available" | "away" | "busy" | "offline";
export type PhoneType = "mobile" | "work" | "home" | "other" | "fax" | "extension";

export interface PhoneNumber {
  id: number;
  type: PhoneType;
  number: string;
  countryCode?: string;
  isPrimary?: boolean;
}

export interface Contact {
  id: number;
  name: string;
  number: string; // Primary number (for backward compatibility)
  favorite: boolean;
  avatar: string | null;
  presence: PresenceStatus;
  countryCode?: string;
  phoneNumbers?: PhoneNumber[];
  email?: string;
  notes?: string;
  company?: string;
  jobTitle?: string;
}
