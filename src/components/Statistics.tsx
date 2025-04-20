
import React, { useState } from "react";
import StatsHeader from "./statistics/StatsHeader";
import StatsLayout from "./statistics/StatsLayout";
import CallVolumeChart from "./statistics/CallVolumeChart";
import CallTypesChart from "./statistics/CallTypesChart";
import { mockCallData, callTypeData, chartConfig } from "./statistics/mockData";

const Statistics = () => {
  const [timeRange, setTimeRange] = useState("daily");
  const [chartData, setChartData] = useState(mockCallData.daily);

  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value);
    setChartData(mockCallData[value as keyof typeof mockCallData]);
  };

  return (
    <StatsLayout>
      <StatsHeader 
        timeRange={timeRange} 
        onTimeRangeChange={handleTimeRangeChange}
      />
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
    </StatsLayout>
  );
};

export default Statistics;
