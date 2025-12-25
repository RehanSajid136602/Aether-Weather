import { GoogleGenAI, Type } from "@google/genai";
import { CitySearchResult, WeatherData, AIAnalysisResult, DailyForecast, HourlyForecast } from "../types";

// Helper to get AI instance safely
// The API key must be obtained exclusively from the environment variable process.env.API_KEY
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// WMO Weather Code Mapping
const wmoToCondition = (code: number): string => {
  const map: Record<number, string> = {
    0: "Clear Sky",
    1: "Mainly Clear", 2: "Partly Cloudy", 3: "Overcast",
    45: "Fog", 48: "Depositing Rime Fog",
    51: "Light Drizzle", 53: "Moderate Drizzle", 55: "Dense Drizzle",
    56: "Light Freezing Drizzle", 57: "Dense Freezing Drizzle",
    61: "Slight Rain", 63: "Moderate Rain", 65: "Heavy Rain",
    66: "Light Freezing Rain", 67: "Heavy Freezing Rain",
    71: "Slight Snow", 73: "Moderate Snow", 75: "Heavy Snow",
    77: "Snow Grains",
    80: "Slight Rain Showers", 81: "Moderate Rain Showers", 82: "Violent Rain Showers",
    85: "Slight Snow Showers", 86: "Heavy Snow Showers",
    95: "Thunderstorm", 96: "Thunderstorm with Hail", 99: "Heavy Thunderstorm with Hail"
  };
  return map[code] || "Unknown";
};

/**
 * FEATURE: Accurate Geocoding
 * Uses Open-Meteo Geocoding API (Free, high accuracy)
 */
export const searchCity = async (query: string): Promise<CitySearchResult[]> => {
  if (!query || query.length < 2) return [];
  
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (!data.results) return [];

    return data.results.map((item: any) => ({
      name: item.name,
      location: `${item.admin1 || ''}, ${item.country}`,
      lat: item.latitude,
      lng: item.longitude
    }));
  } catch (e) {
    console.error("Geocoding failed", e);
    return [];
  }
};

/**
 * FEATURE: Accurate Weather Data
 * Uses Open-Meteo Forecast API (Free, non-commercial, uses NOAA/DWD/etc data)
 */
export const getWeatherData = async (locationInput: string): Promise<WeatherData> => {
  let lat: number, lng: number, city: string = locationInput, country: string = "";

  // 1. Determine Coordinates
  // Check if input is "lat, long" string
  if (locationInput.includes(',')) {
    const parts = locationInput.split(',').map(s => s.trim());
    if (!isNaN(parseFloat(parts[0])) && !isNaN(parseFloat(parts[1]))) {
      // It's a coordinate pair
      lat = parseFloat(parts[0]);
      lng = parseFloat(parts[1]);
      
      // Reverse geocode roughly by finding nearest city (optional, mostly handling UI name via geocode if possible)
      // For simplicity, we'll try to fetch city name if it looks like coords, 
      // but usually the app passes city names unless using geolocation.
      // If pure coords, we might leave city as "My Location" or try to reverse lookup.
      city = "Current Location"; 
    } else {
       // It's likely "City, State" - run search
       const searchRes = await searchCity(locationInput);
       if (!searchRes.length) throw new Error("City not found");
       lat = searchRes[0].lat!;
       lng = searchRes[0].lng!;
       city = searchRes[0].name;
       country = searchRes[0].location;
    }
  } else {
    // It's a city name
    const searchRes = await searchCity(locationInput);
    if (!searchRes.length) throw new Error("City not found");
    lat = searchRes[0].lat!;
    lng = searchRes[0].lng!;
    city = searchRes[0].name;
    country = searchRes[0].location;
  }

  // 2. Fetch Weather Data
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,surface_pressure,wind_speed_10m",
    hourly: "temperature_2m,weather_code",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max",
    timezone: "auto",
    forecast_days: "6" // Get today + 5 days
  });

  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Weather API Error");
    const data = await res.json();

    // 3. Map to internal format
    const current = data.current;
    const hourly = data.hourly;
    const daily = data.daily;

    // Process Hourly (Next 24 hours from now)
    const currentHourIndex = new Date().getHours();
    const hourlyForecast: HourlyForecast[] = [];
    for (let i = currentHourIndex; i < currentHourIndex + 24; i++) {
        if (hourly.time[i]) {
            const date = new Date(hourly.time[i]);
            hourlyForecast.push({
                time: date.toLocaleTimeString([], { hour: 'numeric' }),
                temp: Math.round(hourly.temperature_2m[i])
            });
        }
    }

    // Process Daily (Skip today [0] usually, or show today as first element)
    // The requirement says "5-day forecast", often implying *next* 5 days.
    // Let's include today + next 4 days or just next 5.
    const dailyForecast: DailyForecast[] = [];
    for (let i = 0; i < 5; i++) {
        const date = new Date(daily.time[i]);
        dailyForecast.push({
            day: date.toLocaleDateString('en-US', { weekday: 'short' }),
            high: Math.round(daily.temperature_2m_max[i]),
            low: Math.round(daily.temperature_2m_min[i]),
            condition: wmoToCondition(daily.weather_code[i])
        });
    }

    // Parse time for sunrise/sunset (comes as ISO string)
    const sunriseTime = new Date(daily.sunrise[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const sunsetTime = new Date(daily.sunset[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return {
      city: city,
      country: country,
      currentTemp: Math.round(current.temperature_2m),
      condition: wmoToCondition(current.weather_code),
      feelsLike: Math.round(current.apparent_temperature),
      humidity: current.relative_humidity_2m,
      windSpeed: Math.round(current.wind_speed_10m),
      pressure: Math.round(current.surface_pressure),
      uvIndex: Math.round(daily.uv_index_max[0]), // Use max UV of today
      sunrise: sunriseTime,
      sunset: sunsetTime,
      hourly: hourlyForecast,
      daily: dailyForecast,
      groundingSource: "Open-Meteo (National Weather Services)"
    };

  } catch (error) {
    console.error("Fetch weather error", error);
    throw error;
  }
};

/**
 * FEATURE: Thinking Mode
 * Uses gemini-3-pro-preview with high thinking budget for deep analysis.
 */
export const getDeepAnalysis = async (weather: WeatherData): Promise<AIAnalysisResult> => {
  const ai = getAI();

  const prompt = `
    Analyze this weather data for ${weather.city}:
    Condition: ${weather.condition}, Temp: ${weather.currentTemp}C, Feels Like: ${weather.feelsLike}C, 
    Humidity: ${weather.humidity}%, Wind: ${weather.windSpeed}km/h, UV: ${weather.uvIndex}.
    Forecast: ${JSON.stringify(weather.daily)}.

    Provide:
    1. Detailed health/activity advice (e.g., outdoor sports, allergies, UV protection).
    2. Specific outfit recommendation.
    3. A brief "poetic" description of the day.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      thinkingConfig: { thinkingBudget: 32768 }, // Max budget for deep thinking
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          advice: { type: Type.STRING },
          outfit: { type: Type.STRING },
          details: { type: Type.STRING }
        }
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

/**
 * FEATURE: Fast AI Responses
 * Uses gemini-3-flash-preview for quick summaries.
 */
export const getQuickSummary = async (weather: WeatherData): Promise<string> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview", // Basic Text Tasks
        contents: `Give a 10-word witty summary of this weather: ${weather.condition}, ${weather.currentTemp}C in ${weather.city}. Return plain text only, absolutely no markdown formatting like bold, italics or asterisks.`
    });
    return response.text || "";
}