import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useContacts } from "@/hooks/useContacts";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Plus, Trash2, ArrowLeft } from "lucide-react";
import { Contact, PhoneNumber, PhoneType } from "@/types/contacts";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const phoneSchema = z.object({
  id: z.number().optional(),
  type: z.string() as z.ZodType<PhoneType>,
  number: z.string().min(1, "Phone number is required"),
  countryCode: z.string().optional(),
  isPrimary: z.boolean().optional(),
});

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  avatar: z.string().optional().nullable(),
  company: z.string().optional().or(z.literal("")),
  jobTitle: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  favorite: z.boolean(),
  phoneNumbers: z.array(phoneSchema).min(1, "At least one phone number is required"),
});

type FormValues = z.infer<typeof contactSchema>;

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
          setValue("phoneNumbers", contact.phoneNumbers);
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
      
      await updateContact({
        id: Number(id),
        name: data.name,
        favorite: data.favorite,
        phoneNumbers: data.phoneNumbers,
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
    const currentPhoneNumbers = form.getValues("phoneNumbers");
    setValue("phoneNumbers", [
      ...currentPhoneNumbers,
      { id: nextPhoneId, type: "mobile", number: "", countryCode: "+1", isPrimary: false },
    ]);
    setNextPhoneId(nextPhoneId + 1);
  };

  const removePhoneNumber = (index: number) => {
    const currentPhoneNumbers = form.getValues("phoneNumbers");
    const isRemovingPrimary = currentPhoneNumbers[index].isPrimary;
    
    const newPhoneNumbers = currentPhoneNumbers.filter((_, i) => i !== index);
    
    if (isRemovingPrimary && newPhoneNumbers.length > 0) {
      newPhoneNumbers[0].isPrimary = true;
    }
    
    setValue("phoneNumbers", newPhoneNumbers);
  };

  const setPrimaryPhoneNumber = (index: number) => {
    const currentPhoneNumbers = [...form.getValues("phoneNumbers")];
    currentPhoneNumbers.forEach((phone, i) => {
      phone.isPrimary = i === index;
    });
    setValue("phoneNumbers", currentPhoneNumbers);
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-3xl mx-auto my-8">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-6 w-40" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !contacts.find(c => c.id === Number(id))) {
    return (
      <Card className="w-full max-w-3xl mx-auto my-8">
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load contact information. The contact may not exist or there was an error loading the data.
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    );
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
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center space-x-2">
                <FormField
                  control={form.control}
                  name="favorite"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Add to favorites</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-2">Phone Numbers</h3>
                <div className="space-y-3">
                  {phoneNumbers.map((phone, index) => (
                    <div key={phone.id} className="flex items-center space-x-2">
                      <div className="flex-grow grid gap-2 grid-cols-12">
                        <div className="col-span-3">
                          <Select
                            value={phone.type}
                            onValueChange={(value) => {
                              const current = [...phoneNumbers];
                              current[index].type = value as PhoneType;
                              setValue("phoneNumbers", current);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mobile">Mobile</SelectItem>
                              <SelectItem value="work">Work</SelectItem>
                              <SelectItem value="home">Home</SelectItem>
                              <SelectItem value="fax">Fax</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="col-span-2">
                          <Input
                            value={phone.countryCode || ""}
                            onChange={(e) => {
                              const current = [...phoneNumbers];
                              current[index].countryCode = e.target.value;
                              setValue("phoneNumbers", current);
                            }}
                            placeholder="+1"
                          />
                        </div>
                        
                        <div className="col-span-5">
                          <Input
                            value={phone.number}
                            onChange={(e) => {
                              const current = [...phoneNumbers];
                              current[index].number = e.target.value;
                              setValue("phoneNumbers", current);
                            }}
                            placeholder="Phone number"
                          />
                        </div>
                        
                        <div className="col-span-2 flex items-center gap-1">
                          <Button
                            type="button"
                            variant={phone.isPrimary ? "default" : "outline"}
                            className="w-full h-9 text-xs"
                            onClick={() => setPrimaryPhoneNumber(index)}
                            disabled={phone.isPrimary}
                          >
                            Primary
                          </Button>
                        </div>
                      </div>
                      
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removePhoneNumber(index)}
                        disabled={phoneNumbers.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  {phoneNumbers.length < 5 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addPhoneNumber}
                      className="mt-2"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Number
                    </Button>
                  )}
                </div>
                {form.formState.errors.phoneNumbers && (
                  <p className="text-sm font-medium text-destructive mt-1">
                    {form.formState.errors.phoneNumbers.message}
                  </p>
                )}
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company</FormLabel>
                      <FormControl>
                        <Input placeholder="Company" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="jobTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Job Title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add notes about this contact"
                        className="min-h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
