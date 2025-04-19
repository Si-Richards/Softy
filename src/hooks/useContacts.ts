
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Contact } from "@/types/contacts";
import { mockContacts } from "@/data/mockContacts";

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Simulated API calls
const fetchContacts = async (): Promise<Contact[]> => {
  await delay(1000); // Simulate network delay
  return mockContacts;
};

const toggleContactFavorite = async (contactId: number): Promise<Contact> => {
  await delay(500); // Simulate network delay
  const contact = mockContacts.find(c => c.id === contactId);
  if (!contact) throw new Error("Contact not found");
  return { ...contact, favorite: !contact.favorite };
};

export function useContacts() {
  const queryClient = useQueryClient();
  
  const {
    data: contacts = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["contacts"],
    queryFn: fetchContacts,
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: toggleContactFavorite,
    onSuccess: (updatedContact) => {
      queryClient.setQueryData<Contact[]>(["contacts"], (oldContacts = []) => {
        return oldContacts.map(contact =>
          contact.id === updatedContact.id ? updatedContact : contact
        );
      });
    },
  });

  return {
    contacts,
    isLoading,
    error,
    toggleFavorite: toggleFavoriteMutation.mutate,
  };
}
