
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface StatsHeaderProps {
  timeRange: string;
  onTimeRangeChange: (value: string) => void;
}

const StatsHeader = ({ timeRange, onTimeRangeChange }: StatsHeaderProps) => {
  return (
    <div className="mb-6 flex justify-between items-center">
      <h2 className="text-xl font-semibold">Call Statistics</h2>
      <div className="flex items-center gap-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Select value={timeRange} onValueChange={onTimeRangeChange}>
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
  );
};

export default StatsHeader;
