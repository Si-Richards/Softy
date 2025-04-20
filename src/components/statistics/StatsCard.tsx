
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string;
  changePercent: string;
}

const StatsCard = ({ title, value, changePercent }: StatsCardProps) => {
  return (
    <Card>
      <CardHeader className="py-4 px-6">
        <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
      </CardHeader>
      <CardContent className="py-2 px-6">
        <div className="text-2xl font-bold">{value}</div>
        <div className={`text-sm ${
          changePercent.startsWith("+") ? "text-green-500" : "text-red-500"
        }`}>
          {changePercent} vs previous
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
