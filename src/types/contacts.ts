
import { ReactNode } from "react";

export type PresenceStatus = "available" | "away" | "busy" | "offline";

export interface Contact {
  id: number;
  name: string;
  number: string;
  favorite: boolean;
  avatar: string | null;
  presence: PresenceStatus;
  countryCode?: string;
}

