
import { useState, useEffect } from 'react';
import { format } from 'date-fns';

export interface CallHistoryItem {
  id: number;
  number: string;
  name: string;
  time: Date;
  duration: string;
  type: 'incoming' | 'outgoing' | 'missed';
  status: 'completed' | 'missed';
  countryCode?: string;
}

// This would normally connect to a backend service or local storage
// For now, we'll implement a simple in-memory call history
let callHistoryStore: CallHistoryItem[] = [];

export const useCallHistory = () => {
  const [callHistory, setCallHistory] = useState<CallHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Function to load call history
  const loadCallHistory = () => {
    setIsLoading(true);
    // In a real app, this would fetch from an API or local storage
    setCallHistory([...callHistoryStore]);
    setIsLoading(false);
  };

  // Function to add a new call to history
  const addCallToHistory = (call: Omit<CallHistoryItem, 'id'>) => {
    const newCall = {
      ...call,
      id: Date.now(), // Simple ID generation
    };
    callHistoryStore = [newCall, ...callHistoryStore];
    setCallHistory([...callHistoryStore]);
    
    // In a real app, you would also save this to storage or backend
  };

  // Function to clear call history
  const clearCallHistory = () => {
    callHistoryStore = [];
    setCallHistory([]);
    // In a real app, you would also clear this from storage or backend
  };

  // Load call history on initial render
  useEffect(() => {
    loadCallHistory();
  }, []);

  return {
    callHistory,
    isLoading,
    addCallToHistory,
    clearCallHistory,
    loadCallHistory,
  };
};
