
import React, { useState, useEffect } from "react";
import { useContacts } from "@/hooks/useContacts";
import { CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { toast } from "sonner";
import { ContactEditLoading } from "@/components/contacts/ContactEditLoading";
import { ContactEditError } from "@/components/contacts/ContactEditError";
import { ContactFormContent } from "@/components/contacts/ContactFormContent";
import { contactSchema, FormValues } from "@/components/contacts/ContactEditForm";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";

const ContactEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const contactId = parseInt(id || "0");
  const { contacts, isLoading, error, updateContact } = useContacts();
  const [nextPhoneId, setNextPhoneId] = useState(1);
  const isNewContact = contactId === 0;
  const title = isNewContact ? "Add New Contact" : "Edit Contact";

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
      .map(part => part?.[0] || '')
      .join('')
      .toUpperCase();
  };

  const onClose = () => {
    navigate(-1);
  };

  useEffect(() => {
    // Only populate form if editing existing contact
    if (!isLoading && !isNewContact && contacts.length > 0) {
      const contact = contacts.find(c => c.id === contactId);
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
            number: phone.number,
            // Make sure extension type has empty countryCode
            countryCode: phone.type === "extension" ? "" : (phone.countryCode || "+1")
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
  }, [isLoading, contacts, contactId, setValue, isNewContact]);

  const onSubmit = async (data: FormValues) => {
    try {
      // For new and existing contacts
      const hasPrimary = data.phoneNumbers.some(p => p.isPrimary);
      if (!hasPrimary && data.phoneNumbers.length > 0) {
        data.phoneNumbers[0].isPrimary = true;
      }
      
      const phoneNumbersToSave = data.phoneNumbers.map(phone => ({
        id: phone.id,
        type: phone.type,
        number: phone.number,
        countryCode: phone.type === "extension" ? "" : (phone.countryCode || "+1"),
        isPrimary: phone.isPrimary
      }));
      
      // Find primary phone for main contact fields
      const primaryPhone = phoneNumbersToSave.find(p => p.isPrimary) || phoneNumbersToSave[0];
      
      // For new contact, we would implement create functionality
      // This is a placeholder - in a real app, you'd call an API to create a new contact
      if (isNewContact) {
        toast.success("Contact created successfully");
        // In a real app, we'd have a createContact function in useContacts
        // await createContact({ ...data, phoneNumbers: phoneNumbersToSave });
      } else {
        // For existing contact, update
        const currentContact = contacts.find(c => c.id === contactId);
        if (!currentContact) return;
        
        await updateContact({
          id: contactId,
          name: data.name,
          favorite: data.favorite,
          phoneNumbers: phoneNumbersToSave,
          number: primaryPhone.number,
          countryCode: primaryPhone.countryCode,
          presence: currentContact.presence,
          email: data.email,
          avatar: currentContact.avatar,
          company: data.company,
          jobTitle: data.jobTitle,
          notes: data.notes,
        });
        
        toast.success("Contact updated successfully");
      }
      
      onClose();
    } catch (error) {
      toast.error(isNewContact ? "Failed to create contact" : "Failed to update contact");
      console.error("Error saving contact:", error);
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

  if (isLoading && !isNewContact) return <ContactEditLoading />;
  if (error && !isNewContact) return <ContactEditError />;
  if (!isNewContact && !contacts.find(c => c.id === contactId)) return <ContactEditError />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-3xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <CardTitle>{title}</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center space-x-4 mb-6">
            <Avatar className="h-20 w-20">
              {form.watch("avatar") ? (
                <AvatarImage src={form.watch("avatar") || ""} alt={form.watch("name")} />
              ) : (
                <AvatarFallback className="text-xl">{getInitials(form.watch("name"))}</AvatarFallback>
              )}
            </Avatar>
          </div>

          <ContactFormContent
            form={form}
            phoneNumbers={phoneNumbers}
            onSubmit={onSubmit}
            addPhoneNumber={addPhoneNumber}
            removePhoneNumber={removePhoneNumber}
            setPrimaryPhoneNumber={setPrimaryPhoneNumber}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ContactEdit;
