
import React from "react";
import { Form } from "@/components/ui/form";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ContactDetailsFields } from "./ContactDetailsFields";
import { PhoneNumberList } from "./PhoneNumberList";
import { UseFormReturn } from "react-hook-form";
import { FormValues } from "./ContactEditForm";

interface ContactFormContentProps {
  form: UseFormReturn<FormValues>;
  phoneNumbers: FormValues["phoneNumbers"];
  onSubmit: (data: FormValues) => Promise<void>;
  addPhoneNumber: () => void;
  removePhoneNumber: (index: number) => void;
  setPrimaryPhoneNumber: (index: number) => void;
}

export const ContactFormContent = ({
  form,
  phoneNumbers,
  onSubmit,
  addPhoneNumber,
  removePhoneNumber,
  setPrimaryPhoneNumber,
}: ContactFormContentProps) => {
  const navigate = useNavigate();

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <CardContent>
          <ContactDetailsFields form={form} />
          
          <PhoneNumberList
            form={form}
            phoneNumbers={phoneNumbers}
            onAddPhoneNumber={addPhoneNumber}
            onRemovePhoneNumber={removePhoneNumber}
            onSetPrimaryPhoneNumber={setPrimaryPhoneNumber}
          />
        </CardContent>

        <CardFooter className="flex justify-between px-6">
          <Button variant="outline" type="button" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save Changes
          </Button>
        </CardFooter>
      </form>
    </Form>
  );
};
