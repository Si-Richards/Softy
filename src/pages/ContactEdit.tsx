import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useContacts } from "@/hooks/useContacts";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { PhoneNumberList } from "@/components/contacts/PhoneNumberList";
import { ContactDetailsFields } from "@/components/contacts/ContactDetailsFields";
import { ContactEditLoading } from "@/components/contacts/ContactEditLoading";
import { ContactEditError } from "@/components/contacts/ContactEditError";
import { contactSchema, FormValues } from "@/components/contacts/ContactEditForm";

const ContactEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { contacts, isLoading, error, updateContact } = useContacts();
  const [nextPhoneId, setNextPhoneId] = useState(1);

  const form = useForm<FormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      jobTitle: "",
      notes: "",
      favorite: false,
      phoneNumbers: [{ id: 0, type: "mobile", number: "", countryCode: "+1", isPrimary: true }],
    },
  });

  const { watch, setValue } = form;
  const phoneNumbers = watch("phoneNumbers");

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  useEffect(() => {
    if (!isLoading && id && contacts.length > 0) {
      const contact = contacts.find(c => c.id === Number(id));
      if (contact) {
        setValue("name", contact.name);
        setValue("email", contact.email || "");
        setValue("avatar", contact.avatar);
        setValue("company", contact.company || "");
        setValue("jobTitle", contact.jobTitle || "");
        setValue("notes", contact.notes || "");
        setValue("favorite", contact.favorite);

        if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
          const validPhoneNumbers = contact.phoneNumbers.map(phone => ({
            ...phone,
            id: phone.id,
            type: phone.type,
            number: phone.number
          }));
          setValue("phoneNumbers", validPhoneNumbers);
          const maxId = Math.max(...contact.phoneNumbers.map(p => p.id));
          setNextPhoneId(maxId + 1);
        } else {
          setValue("phoneNumbers", [
            {
              id: 0,
              type: "mobile",
              number: contact.number,
              countryCode: contact.countryCode || "+1",
              isPrimary: true,
            },
          ]);
          setNextPhoneId(1);
        }
      }
    }
  }, [isLoading, contacts, id, setValue]);

  const onSubmit = async (data: FormValues) => {
    try {
      if (!id) return;
      
      const hasPrimary = data.phoneNumbers.some(p => p.isPrimary);
      if (!hasPrimary && data.phoneNumbers.length > 0) {
        data.phoneNumbers[0].isPrimary = true;
      }
      
      const currentContact = contacts.find(c => c.id === Number(id));
      if (!currentContact) return;
      
      const phoneNumbersToSave = data.phoneNumbers.map(phone => ({
        id: phone.id,
        type: phone.type,
        number: phone.number,
        countryCode: phone.countryCode,
        isPrimary: phone.isPrimary
      }));
      
      await updateContact({
        id: Number(id),
        name: data.name,
        favorite: data.favorite,
        phoneNumbers: phoneNumbersToSave,
        number: data.phoneNumbers.find(p => p.isPrimary)?.number || data.phoneNumbers[0].number,
        countryCode: data.phoneNumbers.find(p => p.isPrimary)?.countryCode || data.phoneNumbers[0].countryCode,
        presence: currentContact.presence,
        email: data.email,
        avatar: currentContact.avatar,
        company: data.company,
        jobTitle: data.jobTitle,
        notes: data.notes,
      });
      
      toast.success("Contact updated successfully");
      navigate(-1);
    } catch (error) {
      toast.error("Failed to update contact");
      console.error("Error updating contact:", error);
    }
  };

  const addPhoneNumber = () => {
    setValue("phoneNumbers", [
      ...phoneNumbers,
      { id: nextPhoneId, type: "mobile", number: "", countryCode: "+1", isPrimary: false },
    ]);
    setNextPhoneId(nextPhoneId + 1);
  };

  const removePhoneNumber = (index: number) => {
    const isRemovingPrimary = phoneNumbers[index].isPrimary;
    const newPhoneNumbers = phoneNumbers.filter((_, i) => i !== index);
    
    if (isRemovingPrimary && newPhoneNumbers.length > 0) {
      newPhoneNumbers[0].isPrimary = true;
    }
    
    setValue("phoneNumbers", newPhoneNumbers);
  };

  const setPrimaryPhoneNumber = (index: number) => {
    const current = [...phoneNumbers];
    current.forEach((phone, i) => {
      phone.isPrimary = i === index;
    });
    setValue("phoneNumbers", current);
  };

  if (isLoading) {
    return <ContactEditLoading />;
  }

  if (error || !contacts.find(c => c.id === Number(id))) {
    return <ContactEditError />;
  }

  return (
    <Card className="w-full max-w-3xl mx-auto my-8">
      <CardHeader className="pb-2">
        <div className="flex items-center space-x-2 mb-4">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <CardTitle>Edit Contact</CardTitle>
        </div>
        <div className="flex items-center space-x-4">
          <Avatar className="h-20 w-20">
            {form.watch("avatar") ? (
              <AvatarImage src={form.watch("avatar") || ""} alt={form.watch("name")} />
            ) : (
              <AvatarFallback className="text-xl">{getInitials(form.watch("name"))}</AvatarFallback>
            )}
          </Avatar>
        </div>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <ContactDetailsFields form={form} />
            
            <PhoneNumberList
              form={form}
              phoneNumbers={phoneNumbers}
              onAddPhoneNumber={addPhoneNumber}
              onRemovePhoneNumber={removePhoneNumber}
              onSetPrimaryPhoneNumber={setPrimaryPhoneNumber}
            />

            <CardFooter className="flex justify-between px-0 pb-0">
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
      </CardContent>
    </Card>
  );
};

export default ContactEdit;
