import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { HourlyForecast } from '../types';

interface HourlyChartProps {
  data: HourlyForecast[];
  isNight?: boolean;
}

const HourlyChart: React.FC<HourlyChartProps> = ({ data, isNight = false }) => {
  const strokeColor = isNight ? "#ffffff" : "#334155"; // white vs slate-700
  const fillColor = isNight ? "#ffffff" : "#64748b"; // white vs slate-500
  const axisColor = isNight ? "rgba(255,255,255,0.6)" : "rgba(51, 65, 85, 0.6)";

  return (
    <div className="w-full h-48 mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={fillColor} stopOpacity={isNight ? 0.4 : 0.2}/>
              <stop offset="95%" stopColor={fillColor} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="time" 
            stroke={axisColor} 
            tick={{ fontSize: 12, fill: axisColor }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke={axisColor} 
            tick={{ fontSize: 12, fill: axisColor }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: isNight ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)', 
              borderRadius: '12px', 
              border: 'none', 
              color: isNight ? '#fff' : '#1e293b',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
            }}
          />
          <Area 
            type="monotone" 
            dataKey="temp" 
            stroke={strokeColor} 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorTemp)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HourlyChart;