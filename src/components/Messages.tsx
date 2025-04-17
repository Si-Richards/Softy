
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Send } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock conversations with messages
const mockConversations = [
  {
    id: 1,
    contactId: 1,
    contactName: "John Doe",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=120&h=120",
    unread: 2,
    lastMessageTime: "10:45 AM",
    messages: [
      { id: 1, text: "Hey there! How are you?", sent: false, timestamp: "10:30 AM" },
      { id: 2, text: "I'm good, thanks! How about you?", sent: true, timestamp: "10:35 AM" },
      { id: 3, text: "Great! Just checking about the meeting tomorrow.", sent: false, timestamp: "10:40 AM" },
      { id: 4, text: "Are we still on for 2 PM?", sent: false, timestamp: "10:45 AM" },
    ]
  },
  {
    id: 2,
    contactId: 2,
    contactName: "Alice Smith",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120&h=120",
    unread: 0,
    lastMessageTime: "Yesterday",
    messages: [
      { id: 1, text: "Did you get a chance to review that document?", sent: false, timestamp: "Yesterday, 3:20 PM" },
      { id: 2, text: "Yes, I'll send my comments by EOD", sent: true, timestamp: "Yesterday, 4:15 PM" },
    ]
  },
  {
    id: 3,
    contactId: 4,
    contactName: "Carol Williams",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=120&h=120",
    unread: 0,
    lastMessageTime: "Monday",
    messages: [
      { id: 1, text: "The presentation looks good!", sent: false, timestamp: "Monday, 9:10 AM" },
      { id: 2, text: "Thank you! I worked hard on it.", sent: true, timestamp: "Monday, 9:30 AM" },
    ]
  },
];

const Messages = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeConversation, setActiveConversation] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  const [conversations, setConversations] = useState(mockConversations);
  
  const filteredConversations = conversations.filter(convo => 
    convo.contactName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentConversation = conversations.find(c => c.id === activeConversation);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const sendMessage = () => {
    if (!messageText.trim() || !activeConversation) return;
    
    setConversations(convos => 
      convos.map(convo => {
        if (convo.id === activeConversation) {
          return {
            ...convo,
            messages: [
              ...convo.messages,
              {
                id: Date.now(),
                text: messageText,
                sent: true,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            ],
            lastMessageTime: 'Just now'
          };
        }
        return convo;
      })
    );
    
    setMessageText("");
  };

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="chats" className="h-full flex flex-col">
        <div className="px-4 pt-4 pb-2 border-b">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chats">Chats</TabsTrigger>
            <TabsTrigger value="calls">Calls</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="chats" className="flex-1 flex overflow-hidden">
          <div className="w-1/3 border-r flex flex-col">
            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input 
                  placeholder="Search messages..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-auto">
              {filteredConversations.map(convo => (
                <div 
                  key={convo.id}
                  onClick={() => setActiveConversation(convo.id)}
                  className={`flex items-center p-3 cursor-pointer ${
                    activeConversation === convo.id ? 'bg-gray-100' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12 mr-3">
                      {convo.avatar ? (
                        <AvatarImage src={convo.avatar} alt={convo.contactName} />
                      ) : (
                        <AvatarFallback className="bg-softphone-accent text-white">
                          {getInitials(convo.contactName)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    {convo.unread > 0 && (
                      <div className="absolute -top-1 -right-1 bg-softphone-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {convo.unread}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <div className="font-medium truncate">{convo.contactName}</div>
                      <span className="text-xs text-gray-500">{convo.lastMessageTime}</span>
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {convo.messages[convo.messages.length - 1]?.text || "No messages"}
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredConversations.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  No conversations found
                </div>
              )}
            </div>
          </div>
          
          <div className="w-2/3 flex flex-col">
            {activeConversation ? (
              <>
                <div className="p-3 border-b flex items-center">
                  <Avatar className="h-10 w-10 mr-3">
                    {currentConversation?.avatar ? (
                      <AvatarImage src={currentConversation.avatar} alt={currentConversation.contactName} />
                    ) : (
                      <AvatarFallback className="bg-softphone-accent text-white">
                        {currentConversation && getInitials(currentConversation.contactName)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="font-medium">{currentConversation?.contactName}</div>
                </div>
                
                <div className="flex-1 overflow-auto p-4 space-y-4">
                  {currentConversation?.messages.map(message => (
                    <div 
                      key={message.id} 
                      className={`flex ${message.sent ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[75%] px-4 py-2 rounded-lg ${
                          message.sent 
                            ? 'bg-softphone-primary text-white rounded-br-none' 
                            : 'bg-gray-100 rounded-bl-none'
                        }`}
                      >
                        <div>{message.text}</div>
                        <div className={`text-xs mt-1 ${message.sent ? 'text-blue-100' : 'text-gray-500'}`}>
                          {message.timestamp}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="p-3 border-t flex">
                  <Input 
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    className="flex-1 mr-2"
                  />
                  <Button onClick={sendMessage} disabled={!messageText.trim()}>
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                Select a conversation to start chatting
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="calls" className="flex-1">
          <div className="flex items-center justify-center h-full text-gray-400">
            Call history will be displayed here
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Messages;
