import React from 'react';
import { 
  Sun, Cloud, CloudRain, CloudSnow, CloudLightning, 
  CloudDrizzle, Moon, Wind, CloudFog 
} from 'lucide-react';

interface WeatherIconProps {
  condition: string;
  className?: string;
  isNight?: boolean;
}

export const WeatherIcon: React.FC<WeatherIconProps> = ({ condition, className = "w-10 h-10", isNight = false }) => {
  const lowerCondition = condition.toLowerCase();

  // Color selection based on mode
  const snowColor = isNight ? "text-white" : "text-sky-400";
  const rainColor = isNight ? "text-blue-200" : "text-blue-500";
  const cloudColor = isNight ? "text-gray-200" : "text-slate-400";
  const windColor = isNight ? "text-gray-300" : "text-slate-500";

  if (lowerCondition.includes('storm') || lowerCondition.includes('thunder')) {
    return <CloudLightning className={`${className} text-yellow-400 animate-pulse`} />;
  }
  if (lowerCondition.includes('snow') || lowerCondition.includes('ice') || lowerCondition.includes('flurry')) {
    return <CloudSnow className={`${className} ${snowColor} animate-bounce`} style={{ animationDuration: '3s' }} />;
  }
  if (lowerCondition.includes('rain') || lowerCondition.includes('shower')) {
    return <CloudRain className={`${className} ${rainColor}`} />;
  }
  if (lowerCondition.includes('drizzle')) {
    return <CloudDrizzle className={`${className} ${rainColor}`} />;
  }
  if (lowerCondition.includes('fog') || lowerCondition.includes('mist') || lowerCondition.includes('haze')) {
    return <CloudFog className={`${className} ${cloudColor}`} />;
  }
  if (lowerCondition.includes('cloud') || lowerCondition.includes('overcast')) {
    return <Cloud className={`${className} ${cloudColor}`} />;
  }
  if (lowerCondition.includes('wind')) {
    return <Wind className={`${className} ${windColor}`} />;
  }
  
  // Clear/Sunny
  if (isNight) {
    return <Moon className={`${className} text-yellow-100`} />;
  }
  return <Sun className={`${className} text-orange-400 animate-[spin_10s_linear_infinite]`} />;
};