
import React, { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import StatsCard from "./statistics/StatsCard";
import CallVolumeChart from "./statistics/CallVolumeChart";
import CallTypesChart from "./statistics/CallTypesChart";
import { mockCallData, callTypeData, chartConfig, statsData } from "./statistics/mockData";

const Statistics = () => {
  const [timeRange, setTimeRange] = useState("daily");
  const [chartData, setChartData] = useState(mockCallData.daily);

  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value);
    setChartData(mockCallData[value as keyof typeof mockCallData]);
  };

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
        {statsData.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CallVolumeChart 
          data={chartData}
          timeRange={timeRange}
          config={chartConfig}
        />
        <CallTypesChart 
          data={callTypeData}
          config={chartConfig}
        />
      </div>
    </div>
  );
};

export default Statistics;
