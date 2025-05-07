
import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { FormValues } from "./ContactEditForm";
import { PhoneType } from "@/types/contacts";

interface PhoneNumberListProps {
  form: UseFormReturn<FormValues>;
  phoneNumbers: FormValues["phoneNumbers"];
  onAddPhoneNumber: () => void;
  onRemovePhoneNumber: (index: number) => void;
  onSetPrimaryPhoneNumber: (index: number) => void;
}

export const PhoneNumberList = ({
  form,
  phoneNumbers,
  onAddPhoneNumber,
  onRemovePhoneNumber,
  onSetPrimaryPhoneNumber,
}: PhoneNumberListProps) => {
  const { setValue } = form;

  return (
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
                    // Clear country code if extension type is selected
                    if (value === "extension") {
                      current[index].countryCode = "";
                    } else if (!current[index].countryCode) {
                      current[index].countryCode = "+1"; // Set default if switching from extension
                    }
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
                    <SelectItem value="extension">Extension</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {phone.type !== "extension" && (
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
              )}

              <div className={phone.type === "extension" ? "col-span-7" : "col-span-5"}>
                <Input
                  value={phone.number}
                  onChange={(e) => {
                    const current = [...phoneNumbers];
                    current[index].number = e.target.value;
                    setValue("phoneNumbers", current);
                  }}
                  placeholder={phone.type === "extension" ? "Extension number" : "Phone number"}
                />
              </div>

              <div className="col-span-2 flex items-center gap-1">
                <Button
                  type="button"
                  variant={phone.isPrimary ? "default" : "outline"}
                  className="w-full h-9 text-xs"
                  onClick={() => onSetPrimaryPhoneNumber(index)}
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
              onClick={() => onRemovePhoneNumber(index)}
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
            onClick={onAddPhoneNumber}
            className="mt-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Number
          </Button>
        )}
      </div>
    </div>
  );
};
