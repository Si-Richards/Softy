
import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Play, Trash2, Download, Phone, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";

// Sample voicemail data
const mockVoicemails = [
  {
    id: 1,
    callerName: "John Doe",
    callerNumber: "+1 (555) 123-4567",
    date: new Date(2025, 3, 15, 14, 30),
    duration: "0:48",
    listened: true,
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=120&h=120",
  },
  {
    id: 2,
    callerName: "Unknown",
    callerNumber: "+1 (555) 987-6543",
    date: new Date(2025, 3, 16, 9, 15),
    duration: "1:24",
    listened: false,
    avatar: null,
  },
  {
    id: 3,
    callerName: "Alice Smith",
    callerNumber: "+1 (555) 456-7890",
    date: new Date(2025, 3, 16, 16, 45),
    duration: "0:36",
    listened: false,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120&h=120",
  },
  {
    id: 4,
    callerName: "Bob Johnson",
    callerNumber: "+1 (555) 567-8901",
    date: new Date(2025, 3, 17, 11, 22),
    duration: "2:05",
    listened: true,
    avatar: null,
  },
];

const Voicemail = () => {
  const [voicemails, setVoicemails] = useState(mockVoicemails);
  const [searchTerm, setSearchTerm] = useState("");
  const [playingId, setPlayingId] = useState<number | null>(null);

  const filteredVoicemails = voicemails.filter(
    (vm) =>
      vm.callerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vm.callerNumber.includes(searchTerm)
  );

  const handleDelete = (id: number) => {
    setVoicemails(voicemails.filter((vm) => vm.id !== id));
  };

  const handlePlay = (id: number) => {
    setPlayingId(playingId === id ? null : id);
    // Mark as listened
    setVoicemails(
      voicemails.map((vm) =>
        vm.id === id ? { ...vm, listened: true } : vm
      )
    );
  };

  const getInitials = (name: string) => {
    if (name === "Unknown") return "?";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="w-full p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Voicemail</h2>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search voicemails..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredVoicemails.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Phone className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-4">No voicemails found</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Caller</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVoicemails.map((voicemail) => (
              <TableRow key={voicemail.id} className={voicemail.listened ? "" : "font-medium bg-blue-50"}>
                <TableCell>
                  {!voicemail.listened && (
                    <div className="h-2 w-2 rounded-full bg-softphone-primary"></div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 mr-3">
                      {voicemail.avatar ? (
                        <AvatarImage src={voicemail.avatar} alt={voicemail.callerName} />
                      ) : (
                        <AvatarFallback className="bg-softphone-accent text-white">
                          {getInitials(voicemail.callerName)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <div>{voicemail.callerName}</div>
                      <div className="text-sm text-gray-500">{voicemail.callerNumber}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{format(voicemail.date, "MMM d, yyyy h:mm a")}</TableCell>
                <TableCell>{voicemail.duration}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={playingId === voicemail.id ? "text-softphone-success" : ""}
                      onClick={() => handlePlay(voicemail.id)}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-softphone-error" onClick={() => handleDelete(voicemail.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Phone className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default Voicemail;
