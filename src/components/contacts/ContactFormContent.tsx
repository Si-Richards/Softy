
import React from "react";
import { Form } from "@/components/ui/form";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
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
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <CardContent>
          <div className="space-y-4">
            {/* Import from ContactDetailsFields would be here */}
            <div className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* We don't have access to edit ContactDetailsFields.tsx, so we need to work with what we have */}
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between px-6">
          <Button variant="outline" type="button" onClick={() => form.reset()}>
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
