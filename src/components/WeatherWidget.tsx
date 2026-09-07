import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sun, Cloud, CloudRain, Snowflake, CloudSun, Wind, Droplets, 
  Thermometer, AlertCircle, Compass, ChevronRight, Calendar, Shirt, Info, RefreshCw
} from 'lucide-react';

interface CityWeather {
  city: string;
  country: string;
  temp: number;
  condition: 'Sunny' | 'Rainy' | 'Snowy' | 'Partly Cloudy' | 'Humid & Warm' | 'Breezy';
  humidity: number;
  windSpeed: number;
  uvIndex: number;
  clothingTip: string;
  advisory: string;
  forecast: { day: string; temp: string; condition: string }[];
}

const WEATHER_DATA: Record<string, CityWeather> = {
  Kashmir: {
    city: 'Srinagar (Kashmir)',
    country: 'India',
    temp: 18,
    condition: 'Partly Cloudy',
    humidity: 55,
    windSpeed: 12,
    uvIndex: 4,
    clothingTip: 'Carry a light jacket or cardigan for chilly evenings.',
    advisory: 'Excellent time for Shikara rides and sightseeing. High visibility.',
    forecast: [
      { day: 'Thu', temp: '17°C / 8°C', condition: 'Sunny' },
      { day: 'Fri', temp: '16°C / 9°C', condition: 'Partly Cloudy' },
      { day: 'Sat', temp: '15°C / 7°C', condition: 'Rainy' }
    ]
  },
  Goa: {
    city: 'Panaji (Goa)',
    country: 'India',
    temp: 31,
    condition: 'Sunny',
    humidity: 78,
    windSpeed: 16,
    uvIndex: 9,
    clothingTip: 'Breathable beachwear, sunglasses, sunscreen, and wide-brimmed hats.',
    advisory: 'Perfect beach weather. High UV index, stay hydrated and use sun protection.',
    forecast: [
      { day: 'Thu', temp: '32°C / 26°C', condition: 'Sunny' },
      { day: 'Fri', temp: '31°C / 25°C', condition: 'Sunny' },
      { day: 'Sat', temp: '30°C / 25°C', condition: 'Partly Cloudy' }
    ]
  },
  Kerala: {
    city: 'Munnar (Kerala)',
    country: 'India',
    temp: 23,
    condition: 'Breezy',
    humidity: 65,
    windSpeed: 14,
    uvIndex: 6,
    clothingTip: 'Comfortable linen trousers, light cotton shirts, and sturdy walking shoes.',
    advisory: 'Ideal for tea garden walks. Mist expected in the early hours.',
    forecast: [
      { day: 'Thu', temp: '24°C / 14°C', condition: 'Sunny' },
      { day: 'Fri', temp: '23°C / 15°C', condition: 'Breezy' },
      { day: 'Sat', temp: '22°C / 13°C', condition: 'Partly Cloudy' }
    ]
  },
  Dubai: {
    city: 'Dubai',
    country: 'UAE',
    temp: 38,
    condition: 'Sunny',
    humidity: 45,
    windSpeed: 10,
    uvIndex: 11,
    clothingTip: 'Light cotton or linen clothing. Respectful attire in public shopping malls.',
    advisory: 'Extreme heat warning. Outdoor activities best planned before 10 AM or after 5 PM.',
    forecast: [
      { day: 'Thu', temp: '39°C / 29°C', condition: 'Sunny' },
      { day: 'Fri', temp: '38°C / 28°C', condition: 'Sunny' },
      { day: 'Sat', temp: '38°C / 30°C', condition: 'Sunny' }
    ]
  },
  Singapore: {
    city: 'Singapore',
    country: 'Singapore',
    temp: 29,
    condition: 'Rainy',
    humidity: 85,
    windSpeed: 18,
    uvIndex: 5,
    clothingTip: 'Carry a pocket umbrella or light raincoat, moisture-wicking clothes.',
    advisory: 'Scattered afternoon thundershowers. Indoor attractions like Cloud Forest advised.',
    forecast: [
      { day: 'Thu', temp: '30°C / 25°C', condition: 'Partly Cloudy' },
      { day: 'Fri', temp: '29°C / 24°C', condition: 'Rainy' },
      { day: 'Sat', temp: '31°C / 26°C', condition: 'Breezy' }
    ]
  },
  Maldives: {
    city: 'Malé (Maldives)',
    country: 'Maldives',
    temp: 30,
    condition: 'Humid & Warm',
    humidity: 80,
    windSpeed: 22,
    uvIndex: 10,
    clothingTip: 'Resort chic, swimwear, light fabrics, and open-toe sandals.',
    advisory: 'Pleasant oceanic breeze. Great water visibility for snorkeling and diving.',
    forecast: [
      { day: 'Thu', temp: '31°C / 27°C', condition: 'Humid & Warm' },
      { day: 'Fri', temp: '30°C / 27°C', condition: 'Partly Cloudy' },
      { day: 'Sat', temp: '30°C / 26°C', condition: 'Breezy' }
    ]
  }
};

const CITIES = Object.keys(WEATHER_DATA);

export default function WeatherWidget() {
  const [selectedCity, setSelectedCity] = useState<string>('Kashmir');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('Just now');

  const data = WEATHER_DATA[selectedCity];

  const handleRefresh = () => {
    setIsUpdating(true);
    setTimeout(() => {
      setIsUpdating(false);
      const now = new Date();
      setLastUpdated(`Today at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    }, 800);
  };

  const getWeatherIcon = (condition: string, sizeClass = "h-12 w-12") => {
    switch (condition) {
      case 'Sunny':
        return <Sun className={`${sizeClass} text-amber-500 animate-spin-slow`} />;
      case 'Rainy':
        return <CloudRain className={`${sizeClass} text-sky-400`} />;
      case 'Snowy':
        return <Snowflake className={`${sizeClass} text-teal-300`} />;
      case 'Partly Cloudy':
        return <CloudSun className={`${sizeClass} text-slate-400`} />;
      case 'Breezy':
        return <Wind className={`${sizeClass} text-teal-400`} />;
      case 'Humid & Warm':
        return <Sun className={`${sizeClass} text-amber-500`} />;
      default:
        return <Cloud className={`${sizeClass} text-slate-400`} />;
    }
  };

  return (
    <div className="bg-theme-card border border-theme-border rounded-3xl p-5 sm:p-6 shadow-sm relative overflow-hidden flex flex-col gap-4 shrink-0">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-[-10%] right-[-10%] w-40 h-40 bg-theme-teal/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-40 h-40 bg-theme-gold/5 rounded-full blur-2xl pointer-events-none" />

      {/* Title */}
      <div className="flex items-center justify-between border-b border-theme-border pb-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-theme-navy/5 p-2 rounded-xl border border-theme-border">
            <CloudSun className="h-4 w-4 text-theme-teal" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-theme-heading uppercase tracking-widest">
              Live Destination Climate
            </h4>
            <p className="text-[9px] text-theme-muted font-light">Real-time vacation weather planning</p>
          </div>
        </div>

        {/* Refresh button */}
        <button 
          onClick={handleRefresh}
          className="p-1.5 rounded-lg border border-theme-border hover:bg-theme-navy/5 text-theme-muted transition-colors"
          title="Refresh forecast data"
        >
          <RefreshCw className={`h-3 w-3 ${isUpdating ? 'animate-spin text-theme-teal' : ''}`} />
        </button>
      </div>

      {/* Horizontal Scrollable Destination Selection */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1 shrink-0">
        {CITIES.map(city => {
          const isSelected = selectedCity === city;
          return (
            <button
              key={city}
              onClick={() => setSelectedCity(city)}
              className={`px-3.5 py-2.5 sm:py-1.5 rounded-lg text-[10px] font-bold border whitespace-nowrap transition-all ${
                isSelected 
                  ? 'bg-theme-navy text-white border-theme-navy shadow-sm' 
                  : 'bg-theme-navy/5 text-theme-muted border-theme-border hover:bg-theme-navy/10'
              }`}
            >
              {city}
            </button>
          );
        })}
      </div>

      {/* Main weather info display with beautiful layout */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedCity}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Left Column: Current Weather and Stats */}
          <div className="flex flex-col gap-4">
            {/* Main Panel */}
            <div className="flex items-center justify-between gap-4 bg-gradient-to-r from-theme-navy/5 to-transparent p-4 rounded-2xl border border-theme-border/60">
              <div className="flex items-center gap-3">
                {getWeatherIcon(data.condition)}
                <div>
                  <h5 className="font-serif font-bold text-theme-heading text-sm">{data.city}</h5>
                  <p className="text-[10px] text-theme-muted font-medium flex items-center gap-1">
                    <Compass className="h-2.5 w-2.5 text-theme-gold" />
                    {data.country} • {data.condition}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold font-serif text-theme-heading leading-none">
                  {data.temp}°C
                </div>
                <span className="text-[8px] text-theme-muted mt-1 inline-block bg-theme-navy/5 px-2 py-0.5 rounded-full font-medium">
                  Updated {lastUpdated}
                </span>
              </div>
            </div>

            {/* Micro stats table */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-center">
                <Droplets className="h-3.5 w-3.5 text-theme-teal mx-auto mb-1" />
                <div className="text-[8px] font-bold text-theme-muted uppercase tracking-wider">Humidity</div>
                <div className="text-xs font-bold text-theme-heading mt-0.5">{data.humidity}%</div>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-center">
                <Wind className="h-3.5 w-3.5 text-theme-teal mx-auto mb-1" />
                <div className="text-[8px] font-bold text-theme-muted uppercase tracking-wider">Wind</div>
                <div className="text-xs font-bold text-theme-heading mt-0.5">{data.windSpeed} km/h</div>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-center">
                <Thermometer className="h-3.5 w-3.5 text-theme-teal mx-auto mb-1" />
                <div className="text-[8px] font-bold text-theme-muted uppercase tracking-wider">UV Index</div>
                <div className="text-xs font-bold text-theme-heading mt-0.5">{data.uvIndex}</div>
              </div>
            </div>
          </div>

          {/* Right Column: Recommendations & Forecast */}
          <div className="flex flex-col gap-4">
            {/* Planning Advisor / Recommendation */}
            <div className="flex flex-col gap-3">
              {/* What to Pack Card */}
              <div className="bg-amber-50/65 dark:bg-amber-950/15 border border-amber-200/60 dark:border-amber-900/30 p-4 rounded-2xl flex items-start gap-3 shadow-sm hover:shadow-md transition-all">
                <div className="p-2 bg-amber-100/70 dark:bg-amber-950/40 rounded-xl border border-amber-200/30">
                  <Shirt className="h-4 w-4 text-amber-700 dark:text-theme-gold shrink-0" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-400 tracking-wider">What to Pack</p>
                  <p className="text-xs font-medium text-theme-heading leading-relaxed mt-1">
                    {data.clothingTip}
                  </p>
                </div>
              </div>

              {/* Sightseeing Advisor Card */}
              <div className="bg-blue-50/65 dark:bg-sky-950/15 border border-blue-200/60 dark:border-sky-900/30 p-4 rounded-2xl flex items-start gap-3 shadow-sm hover:shadow-md transition-all">
                <div className="p-2 bg-blue-100/70 dark:bg-sky-950/40 rounded-xl border border-blue-200/30">
                  <Info className="h-4 w-4 text-blue-700 dark:text-sky-400 shrink-0" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-blue-800 dark:text-sky-400 tracking-wider">Sightseeing Advisor</p>
                  <p className="text-xs font-medium text-theme-heading leading-relaxed mt-1">
                    {data.advisory}
                  </p>
                </div>
              </div>
            </div>

            {/* 3-Day Forecast Strip */}
            <div>
              <p className="text-[9px] uppercase font-bold text-theme-muted tracking-wider mb-2 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-theme-gold" /> 3-Day Planning Forecast
              </p>
              <div className="flex flex-col gap-1.5">
                {data.forecast.map((fc, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 border border-slate-100 p-2 rounded-lg transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-theme-heading w-8">{fc.day}</span>
                      {getWeatherIcon(fc.condition, "h-4 w-4")}
                      <span className="text-[10px] text-theme-muted font-light">{fc.condition}</span>
                    </div>
                    <span className="text-[10px] font-bold text-theme-heading">{fc.temp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
