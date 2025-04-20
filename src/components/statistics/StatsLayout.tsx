
import React from "react";
import StatsCard from "./StatsCard";
import { statsData } from "./mockData";

interface StatsLayoutProps {
  children: React.ReactNode;
}

const StatsLayout = ({ children }: StatsLayoutProps) => {
  return (
    <div className="w-full p-6 overflow-y-auto">
      {children}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statsData.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart components will be rendered here */}
      </div>
    </div>
  );
};

export default StatsLayout;
