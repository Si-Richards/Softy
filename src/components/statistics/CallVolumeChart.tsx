
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

interface CallVolumeChartProps {
  data: Array<{ name: string; value: number }>;
  timeRange: string;
  config: any;
}

const CallVolumeChart = ({ data, timeRange, config }: CallVolumeChartProps) => {
  return (
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
          config={config}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={data} 
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
  );
};

export default CallVolumeChart;
