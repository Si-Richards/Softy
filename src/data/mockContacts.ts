
import { Contact, PresenceStatus, PhoneNumber, PhoneType } from "@/types/contacts";

export const mockContacts: Contact[] = [
  { 
    id: 1, 
    name: "John Doe", 
    number: "+1 (555) 123-4567", 
    favorite: true,
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=120&h=120",
    presence: "available" as PresenceStatus,
    countryCode: "US"
  },
  { 
    id: 2, 
    name: "Alice Smith", 
    number: "+44 (555) 987-6543", 
    favorite: true,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120&h=120",
    presence: "busy" as PresenceStatus,
    countryCode: "GB",
    company: "VoiceHost",
    phoneNumbers: [
      {
        id: 1,
        type: "extension" as PhoneType,
        number: "213",
        isPrimary: true
      }
    ]
  },
  { 
    id: 3, 
    name: "Bob Johnson", 
    number: "+1 (555) 456-7890", 
    favorite: false,
    avatar: null,
    presence: "away" as PresenceStatus
  },
  { 
    id: 4, 
    name: "Carol Williams", 
    number: "+1 (555) 567-8901", 
    favorite: false,
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=120&h=120",
    presence: "available" as PresenceStatus
  },
  { 
    id: 5, 
    name: "David Brown", 
    number: "+1 (555) 678-9012", 
    favorite: false,
    avatar: null,
    presence: "offline" as PresenceStatus
  },
  { 
    id: 6, 
    name: "Emma Davis", 
    number: "+1 (555) 789-0123", 
    favorite: false,
    avatar: "https://images.unsplash.com/photo-1629467057571-42d22d8f0cbd?auto=format&fit=crop&q=80&w=120&h=120",
    presence: "available" as PresenceStatus
  },
  { 
    id: 7, 
    name: "Frank Miller", 
    number: "+1 (555) 890-1234", 
    favorite: false,
    avatar: null,
    presence: "busy" as PresenceStatus
  },
  { 
    id: 8, 
    name: "Grace Wilson", 
    number: "+1 (555) 901-2345", 
    favorite: false,
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120&h=120",
    presence: "away" as PresenceStatus
  }
].sort((a, b) => a.name.localeCompare(b.name));
