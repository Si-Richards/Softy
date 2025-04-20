import React, { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const mockCallData = {
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

const callTypeData = [
  { name: "Incoming", value: 45 },
  { name: "Outgoing", value: 55 },
  { name: "Missed", value: 10 },
  { name: "Voicemail", value: 5 },
];

const pieColors = ["#2563eb", "#0ea5e9", "#ef4444", "#f59e0b"];

const chartConfig = {
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

const Statistics = () => {
  const [timeRange, setTimeRange] = useState("daily");
  const [chartData, setChartData] = useState(mockCallData.daily);

  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value);
    setChartData(mockCallData[value as keyof typeof mockCallData]);
  };

  const stats = [
    { title: "Total Calls", value: "352", changePercent: "+12%" },
    { title: "Avg. Call Duration", value: "4m 23s", changePercent: "-2%" },
    { title: "Answer Rate", value: "89%", changePercent: "+5%" },
    { title: "Avg. Ring Time", value: "8.2s", changePercent: "-12%" },
  ];

  return (
    <div className="w-full p-6 overflow-y-auto">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Call Statistics</h2>
        <div className="flex items-center gap-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Select value={timeRange} onValueChange={handleTimeRangeChange}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </TooltipTrigger>
              <TooltipContent>Select time range for statistics</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm">Export Data</Button>
              </TooltipTrigger>
              <TooltipContent>Export statistics data</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="py-4 px-6">
              <CardTitle className="text-sm font-medium text-gray-500">{stat.title}</CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-6">
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className={`text-sm ${
                stat.changePercent.startsWith("+") ? "text-green-500" : "text-red-500"
              }`}>
                {stat.changePercent} vs previous
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Call Volume</CardTitle>
            <CardDescription>
              Number of calls per {timeRange === "daily" ? "day" : timeRange === "weekly" ? "week" : "month"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <ChartContainer 
              className="h-[350px] w-full"
              config={chartConfig}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={chartData} 
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" name="Calls" fill="var(--color-calls)" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Call Types</CardTitle>
            <CardDescription>
              Distribution of different call types
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ChartContainer className="h-[250px]" config={chartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={callTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {callTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Statistics;
