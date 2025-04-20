
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { pieColors } from "./mockData";

interface CallTypesChartProps {
  data: Array<{ name: string; value: number }>;
  config: any;
}

const CallTypesChart = ({ data, config }: CallTypesChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Call Types</CardTitle>
        <CardDescription>Distribution of different call types</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center">
        <ChartContainer className="h-[250px]" config={config}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={70}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
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
  );
};

export default CallTypesChart;
