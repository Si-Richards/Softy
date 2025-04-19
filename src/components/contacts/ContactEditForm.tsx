
import { z } from "zod";
import { PhoneType } from "@/types/contacts";

export const phoneSchema = z.object({
  id: z.number(),
  type: z.string() as z.ZodType<PhoneType>,
  number: z.string().min(1, "Phone number is required"),
  countryCode: z.string().optional(),
  isPrimary: z.boolean().optional(),
});

export const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  avatar: z.string().optional().nullable(),
  company: z.string().optional().or(z.literal("")),
  jobTitle: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  favorite: z.boolean(),
  phoneNumbers: z.array(phoneSchema).min(1, "At least one phone number is required"),
});

export type FormValues = z.infer<typeof contactSchema>;
