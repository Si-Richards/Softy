
export const mockCallData = {
  daily: [
    { name: "Mon", value: 12 },
    { name: "Tue", value: 19 },
    { name: "Wed", value: 15 },
    { name: "Thu", value: 18 },
    { name: "Fri", value: 14 },
    { name: "Sat", value: 8 },
    { name: "Sun", value: 6 },
  ],
  weekly: [
    { name: "Week 1", value: 65 },
    { name: "Week 2", value: 59 },
    { name: "Week 3", value: 80 },
    { name: "Week 4", value: 71 },
  ],
  monthly: [
    { name: "Jan", value: 200 },
    { name: "Feb", value: 180 },
    { name: "Mar", value: 250 },
    { name: "Apr", value: 300 },
    { name: "May", value: 280 },
    { name: "Jun", value: 320 },
  ],
};

export const callTypeData = [
  { name: "Incoming", value: 45 },
  { name: "Outgoing", value: 55 },
  { name: "Missed", value: 10 },
  { name: "Voicemail", value: 5 },
];

export const chartConfig = {
  calls: { 
    theme: {
      light: '#2563eb',
      dark: '#3b82f6'
    }
  },
  incoming: {
    color: '#2563eb'
  },
  outgoing: {
    color: '#0ea5e9'
  },
  missed: {
    color: '#ef4444'
  },
  voicemail: {
    color: '#f59e0b'
  }
};

export const pieColors = ["#2563eb", "#0ea5e9", "#ef4444", "#f59e0b"];

export const statsData = [
  { title: "Total Calls", value: "352", changePercent: "+12%" },
  { title: "Avg. Call Duration", value: "4m 23s", changePercent: "-2%" },
  { title: "Answer Rate", value: "89%", changePercent: "+5%" },
  { title: "Avg. Ring Time", value: "8.2s", changePercent: "-12%" },
];
