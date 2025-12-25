import React, { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Wind, Droplets, Thermometer, Sun, Loader2, Sparkles, BrainCircuit, Heart, Menu, X } from 'lucide-react';
import { searchCity, getWeatherData, getDeepAnalysis, getQuickSummary } from './services/geminiService';
import { WeatherData, CitySearchResult, AIAnalysisResult } from './types';
import { WeatherIcon } from './components/WeatherIcon';
import HourlyChart from './components/HourlyChart';

function App() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<CitySearchResult[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [quickSummary, setQuickSummary] = useState<string>("");
  const [theme, setTheme] = useState<string>("from-sky-200 via-blue-100 to-white");
  const [isNightMode, setIsNightMode] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize favorites from local storage
  useEffect(() => {
    const stored = localStorage.getItem('favorites');
    if (stored) setFavorites(JSON.parse(stored));
  }, []);

  const saveFavorite = (city: string) => {
    const newFavs = [...favorites, city];
    setFavorites(newFavs);
    localStorage.setItem('favorites', JSON.stringify(newFavs));
  };

  const removeFavorite = (city: string) => {
    const newFavs = favorites.filter(c => c !== city);
    setFavorites(newFavs);
    localStorage.setItem('favorites', JSON.stringify(newFavs));
  };

  const updateTheme = (condition: string, isNight: boolean) => {
    setIsNightMode(isNight);
    const c = condition.toLowerCase();
    
    if (isNight) {
      setTheme("from-slate-900 to-indigo-950");
      return;
    }

    // High contrast light themes
    if (c.includes('rain') || c.includes('drizzle')) setTheme("from-blue-200 via-slate-200 to-gray-100");
    else if (c.includes('storm') || c.includes('thunder')) setTheme("from-slate-400 via-slate-300 to-gray-200");
    else if (c.includes('cloud') || c.includes('overcast')) setTheme("from-slate-200 via-gray-100 to-white");
    else if (c.includes('snow') || c.includes('ice')) setTheme("from-blue-50 via-indigo-50 to-white");
    else if (c.includes('fog') || c.includes('mist')) setTheme("from-gray-200 via-slate-100 to-white");
    else setTheme("from-sky-200 via-blue-100 to-white"); // Clear/Sunny default
  };

  const fetchWeather = useCallback(async (location: string) => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    setSuggestions([]);
    setQuery(""); // Clear search bar for visual cleanliness
    
    try {
      const data = await getWeatherData(location);
      setWeather(data);
      
      const currentHour = new Date().getHours();
      const nightTime = currentHour < 6 || currentHour > 20;
      updateTheme(data.condition, nightTime);

      // Trigger quick summary (Fast AI)
      getQuickSummary(data).then(setQuickSummary);
      
    } catch (err) {
      setError("Failed to fetch weather. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (val.length > 2) {
      // Maps Grounding for autocomplete
      const results = await searchCity(val);
      setSuggestions(results);
    } else {
      setSuggestions([]);
    }
  };

  const handleDeepAnalysis = async () => {
    if (!weather) return;
    setAiLoading(true);
    try {
      const result = await getDeepAnalysis(weather);
      setAnalysis(result);
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  const handleGeoLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = `${pos.coords.latitude}, ${pos.coords.longitude}`;
          fetchWeather(coords);
        },
        (err) => {
          setError("Location access denied.");
          setLoading(false);
        }
      );
    }
  };

  // Initial load: Try geolocation, fallback to default if denied
  useEffect(() => {
    if (!weather) {
      if (navigator.geolocation) {
        setLoading(true); // Show loading while waiting for user interaction
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const coords = `${pos.coords.latitude}, ${pos.coords.longitude}`;
            fetchWeather(coords);
          },
          (err) => {
            // Permission denied or error
            console.warn("Location denied:", err);
            fetchWeather("New York").then(() => {
              // Delay setting error so it appears after fetchWeather clears it
              setTimeout(() => setError("Location access needed for local weather. Showing default city."), 100);
            });
          },
          { timeout: 8000 }
        );
      } else {
        fetchWeather("New York");
      }
    }
  }, []);

  // Dynamic Styles based on Night/Day
  // INCREASED CONTRAST: Darker text (slate-900) and lighter backgrounds (white/80)
  const textColor = isNightMode ? "text-white" : "text-slate-900";
  const subTextColor = isNightMode ? "text-white/60" : "text-slate-600";
  const cardBg = isNightMode ? "bg-white/10 border-white/20" : "bg-white/80 border-white/50 shadow-2xl";
  const inputBg = isNightMode ? "bg-white/10 placeholder-white/50 text-white" : "bg-white/80 placeholder-slate-500 text-slate-900";
  const iconColor = isNightMode ? "text-white/80" : "text-slate-800";

  return (
    <div className={`min-h-screen transition-colors duration-1000 bg-gradient-to-br ${theme} ${textColor} p-4 md:p-8 flex flex-col items-center overflow-x-hidden relative`}>
      
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full blur-3xl opacity-40 animate-pulse ${isNightMode ? 'bg-white/10' : 'bg-blue-400/20'}`}></div>
        <div className={`absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full blur-3xl opacity-30 ${isNightMode ? 'bg-purple-500/20' : 'bg-orange-300/30'}`}></div>
      </div>

      {/* Header / Search - High Z-Index for Dropdown Visibility */}
      <div className="w-full max-w-5xl z-40 flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div className="flex items-center gap-2">
           <div className={`p-2 rounded-xl backdrop-blur-md ${isNightMode ? 'bg-white/20' : 'bg-white/80 shadow-sm'}`}>
             <Wind className={`w-6 h-6 ${isNightMode ? 'text-white' : 'text-blue-700'}`} />
           </div>
           <h1 className="text-2xl font-bold tracking-tight">Aether Weather</h1>
        </div>

        <div className="relative w-full md:w-96">
          <div className="relative flex items-center">
            <input
              type="text"
              value={query}
              onChange={handleSearchChange}
              placeholder="Search city..."
              className={`w-full pl-10 pr-4 py-3 border border-transparent rounded-2xl backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all shadow-lg ${inputBg}`}
            />
            <Search className={`absolute left-3 w-5 h-5 ${subTextColor}`} />
            <button 
              onClick={handleGeoLocation}
              className={`absolute right-2 p-1.5 rounded-xl transition-colors ${isNightMode ? 'hover:bg-white/20' : 'hover:bg-black/5'}`}
              title="Use current location"
            >
              <MapPin className={`w-5 h-5 ${iconColor}`} />
            </button>
          </div>
          
          {/* Autocomplete Dropdown */}
          {suggestions.length > 0 && (
            <div className={`absolute top-full left-0 right-0 mt-2 border backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-60 overflow-y-auto z-50 ${isNightMode ? 'bg-black/60 border-white/20' : 'bg-white/95 border-white/40'}`}>
              {suggestions.map((s, idx) => (
                <button 
                  key={idx}
                  onClick={() => fetchWeather(s.name)}
                  className={`px-4 py-3 text-left transition-colors border-b last:border-0 flex items-center justify-between ${isNightMode ? 'hover:bg-white/10 border-white/10' : 'hover:bg-blue-50 border-gray-100'}`}
                >
                  <span className="font-medium">{s.name}</span>
                  <span className={`text-xs ${subTextColor}`}>{s.location}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button 
          onClick={() => setShowFavorites(!showFavorites)}
          className={`p-3 rounded-2xl backdrop-blur-md border transition-all ${isNightMode ? 'bg-white/10 border-white/20 hover:bg-white/20' : 'bg-white/80 border-white/40 hover:bg-white shadow-md'}`}
        >
          {showFavorites ? <X /> : <Menu />}
        </button>
      </div>

      {/* Favorites Sidebar */}
      <div className={`fixed inset-y-0 right-0 w-72 backdrop-blur-2xl transform transition-transform duration-300 z-50 p-6 shadow-2xl ${showFavorites ? 'translate-x-0' : 'translate-x-full'} ${isNightMode ? 'bg-slate-900/90 border-l border-white/10 text-white' : 'bg-white/95 border-l border-slate-200 text-slate-900'}`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Saved Places</h2>
          <button onClick={() => setShowFavorites(false)} className={`p-1 rounded-full ${isNightMode ? 'hover:bg-white/20' : 'hover:bg-black/5'}`}><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3">
          {favorites.length === 0 && <p className="opacity-50 text-sm">No saved cities yet.</p>}
          {favorites.map(city => (
            <div key={city} className={`flex items-center justify-between p-3 rounded-xl ${isNightMode ? 'bg-white/10' : 'bg-slate-100 hover:bg-slate-200'}`}>
              <span onClick={() => { fetchWeather(city); setShowFavorites(false); }} className="cursor-pointer hover:underline font-medium">{city}</span>
              <button onClick={() => removeFavorite(city)} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-600 px-6 py-3 rounded-xl mb-6 backdrop-blur-md font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className={`w-12 h-12 animate-spin mb-4 ${iconColor}`} />
          <p className="animate-pulse font-medium opacity-70">Consulting the atmosphere...</p>
        </div>
      ) : weather ? (
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-6 z-10 animate-[fadeIn_0.5s_ease-out]">
          
          {/* Main Weather Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className={`relative p-8 rounded-[2.5rem] backdrop-blur-xl overflow-hidden group ${cardBg}`}>
              
              <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <MapPin className={`w-5 h-5 ${iconColor}`} />
                    <h2 className="text-3xl font-bold">{weather.city}, {weather.country}</h2>
                    <button 
                      onClick={() => favorites.includes(weather.city) ? removeFavorite(weather.city) : saveFavorite(weather.city)}
                      className="ml-2 transition-colors"
                    >
                      <Heart className={`w-6 h-6 ${favorites.includes(weather.city) ? 'fill-red-500 text-red-500' : 'text-slate-400 hover:text-red-400'}`} />
                    </button>
                  </div>
                  <p className="text-lg opacity-80 capitalize font-medium">{weather.condition}</p>
                  <p className={`text-sm mt-1 ${subTextColor}`}>{weather.groundingSource && `Data via ${weather.groundingSource}`}</p>
                </div>
                <div className="text-right">
                  <div className="text-7xl md:text-9xl font-bold tracking-tighter drop-shadow-sm">
                    {Math.round(weather.currentTemp)}°
                  </div>
                  <p className="text-xl font-medium opacity-80">Feels like {Math.round(weather.feelsLike)}°</p>
                </div>
              </div>

              {/* Fast AI Summary */}
              {quickSummary && (
                <div className={`mt-6 p-4 rounded-2xl flex items-start gap-3 border ${isNightMode ? 'bg-black/20 border-white/5' : 'bg-blue-50/50 border-blue-100'}`}>
                  <Sparkles className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm italic font-medium leading-relaxed opacity-90">{quickSummary}</p>
                </div>
              )}

              <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                 <StatCard icon={<Droplets />} label="Humidity" value={`${weather.humidity}%`} isNight={isNightMode} />
                 <StatCard 
                   icon={<Wind className={weather.windSpeed > 15 ? "animate-wind" : ""} />} 
                   label="Wind" 
                   value={`${weather.windSpeed} km/h`} 
                   isNight={isNightMode} 
                 />
                 <StatCard icon={<Thermometer />} label="Pressure" value={`${weather.pressure} hPa`} isNight={isNightMode} />
                 <StatCard icon={<Sun />} label="UV Index" value={weather.uvIndex.toString()} isNight={isNightMode} />
              </div>
            </div>

            {/* Hourly Chart */}
            <div className={`p-6 rounded-3xl backdrop-blur-md ${cardBg}`}>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isNightMode ? 'bg-white' : 'bg-blue-500'}`}></div> 
                Hourly Forecast
              </h3>
              <HourlyChart data={weather.hourly} isNight={isNightMode} />
            </div>

            {/* Thinking / AI Analysis Section */}
            <div className={`p-1 rounded-[2.5rem] bg-gradient-to-r ${isNightMode ? 'from-pink-500/50 to-indigo-500/50' : 'from-pink-300 to-indigo-300'} p-[1px]`}>
               <div className={`backdrop-blur-xl rounded-[2.5rem] p-6 ${isNightMode ? 'bg-black/20' : 'bg-white/80'}`}>
                 <div className="flex justify-between items-center mb-4">
                   <div className="flex items-center gap-2">
                     <BrainCircuit className="text-pink-500 w-6 h-6" />
                     <h3 className={`text-xl font-bold bg-clip-text text-transparent ${isNightMode ? 'bg-gradient-to-r from-pink-200 to-indigo-200' : 'bg-gradient-to-r from-pink-600 to-indigo-600'}`}>Deep Weather Intelligence</h3>
                   </div>
                   {!analysis && (
                     <button 
                       onClick={handleDeepAnalysis}
                       disabled={aiLoading}
                       className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50 ${isNightMode ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                     >
                       {aiLoading ? <Loader2 className="animate-spin w-4 h-4" /> : "Analyze"}
                     </button>
                   )}
                 </div>

                 {aiLoading && (
                   <div className="space-y-3 animate-pulse">
                     <div className={`h-4 rounded w-3/4 ${isNightMode ? 'bg-white/10' : 'bg-slate-200'}`}></div>
                     <div className={`h-4 rounded w-1/2 ${isNightMode ? 'bg-white/10' : 'bg-slate-200'}`}></div>
                   </div>
                 )}

                 {analysis && (
                   <div className="space-y-4 animate-[slideUp_0.3s_ease-out]">
                      <div className={`p-4 rounded-2xl border ${isNightMode ? 'bg-white/5 border-white/10' : 'bg-white border-pink-100 shadow-sm'}`}>
                        <h4 className={`font-semibold mb-1 ${isNightMode ? 'text-pink-200' : 'text-pink-600'}`}>Expert Advice</h4>
                        <p className="text-sm opacity-90">{analysis.advice}</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className={`p-4 rounded-2xl border ${isNightMode ? 'bg-white/5 border-white/10' : 'bg-white border-indigo-100 shadow-sm'}`}>
                          <h4 className={`font-semibold mb-1 ${isNightMode ? 'text-indigo-200' : 'text-indigo-600'}`}>Outfit Check</h4>
                          <p className="text-sm opacity-90">{analysis.outfit}</p>
                        </div>
                        <div className={`p-4 rounded-2xl border ${isNightMode ? 'bg-white/5 border-white/10' : 'bg-white border-blue-100 shadow-sm'}`}>
                          <h4 className={`font-semibold mb-1 ${isNightMode ? 'text-blue-200' : 'text-blue-600'}`}>Details</h4>
                          <p className="text-sm opacity-90">{analysis.details}</p>
                        </div>
                      </div>
                   </div>
                 )}
               </div>
            </div>
          </div>

          {/* Sidebar / 5-Day Forecast */}
          <div className="lg:col-span-1 space-y-6">
            <div className={`p-6 rounded-3xl backdrop-blur-md h-full ${cardBg}`}>
              <h3 className="text-xl font-bold mb-6">5-Day Forecast</h3>
              <div className="space-y-4">
                {weather.daily.map((day, i) => (
                  <div key={i} className={`flex items-center justify-between p-3 rounded-xl transition-colors group ${isNightMode ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-12 text-center font-medium opacity-80">{day.day}</div>
                      <WeatherIcon condition={day.condition} isNight={isNightMode} className="w-8 h-8 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="flex items-center gap-4">
                       <span className="font-bold text-lg">{Math.round(day.high)}°</span>
                       <span className={`text-sm ${subTextColor}`}>{Math.round(day.low)}°</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sun Times */}
            <div className={`p-6 rounded-3xl backdrop-blur-md ${cardBg}`}>
               <div className="flex justify-between items-center mb-4">
                  <div className="flex flex-col items-center">
                    <span className={`text-xs mb-1 ${subTextColor}`}>Sunrise</span>
                    <span className="font-semibold">{weather.sunrise}</span>
                  </div>
                  <div className={`w-full h-[1px] mx-4 relative ${isNightMode ? 'bg-white/20' : 'bg-slate-200'}`}>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-8 rounded-t-full border-t-2 border-yellow-400"></div>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className={`text-xs mb-1 ${subTextColor}`}>Sunset</span>
                    <span className="font-semibold">{weather.sunset}</span>
                  </div>
               </div>
            </div>
          </div>

        </div>
      ) : null}

      {/* Footer */}
      <div className={`mt-12 text-center text-xs ${subTextColor}`}>
        Powered by Gemini AI • Weather Data by Open-Meteo • Built with React & Tailwind
      </div>
      
    </div>
  );
}

const StatCard = ({ icon, label, value, isNight }: { icon: React.ReactNode, label: string, value: string, isNight: boolean }) => (
  <div className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-colors ${isNight ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white/50 border-white/50 hover:bg-white/80'}`}>
    <div className={`mb-2 opacity-70 ${isNight ? 'text-white' : 'text-slate-600'}`}>{React.cloneElement(icon as React.ReactElement, { size: 20 })}</div>
    <span className={`text-xs uppercase tracking-wider opacity-60`}>{label}</span>
    <span className="font-semibold mt-1">{value}</span>
  </div>
);

export default App;