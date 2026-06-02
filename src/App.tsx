// CREATED IN JAVASCRIPT / REACT (JSX SYNTAX)
// IMPORTS
import { useState, useEffect } from 'react'; 
//import { droneDatabase, type Drone } from './drones';
import { droneDatabase } from './drones';
import type { Drone } from './drones';
import { logService, type FlightEntry, type WeatherData } from './services/logService';
import { 
  Shield, ListRestart, MapPin, RefreshCw
} from 'lucide-react'; //used to import the lucide icon pack

// STATIC DATA used to populate the Risk Assessment checklist
const riskTasks = [
  { id: 'weather', label: 'Check Local Weather', url: 'https://www.windy.com' }, //adjust this URL to your favourite weather source
  { id: 'airspace', label: 'Check Airspace Restrictions', url: 'https://map.droneguide.be/' }, //adjust this URL to your favourite airspace restriction site
  { id: 'notams', label: 'Review NOTAMs', url: 'https://notaminfo.com/belgiummap' }, //adjust this URL to your favourite NOTAM source
  { id: 'ads-b', label: 'Review ADS-B (airspace)', url: 'https://globe.adsbexchange.com/' }, //adjust this URL to your favourite aircraft tracker website
  { id: 'hardware', label: 'Check Drone Hardware (Props/Battery)', url: '#' },
  { id: 'landing', label: 'Check Landing Zone (Flat/Clear)', url: '#' },
  { id: 'hazmat', label: 'Check Hazardous Materials/Interference', url: '#' },
  { id: 'obstacles', label: 'Check Obstacles in Flight Path', url: '#' },
  { id: 'fitness', label: 'Do I feel fit to fly? (I’M SAFE)', url: '#' },
];

// START OF FUNCTION APP
function App() {
  // --- 1. STATE DEFINITIONS --- these are variables that will be used in the application and require to be defined by const 
  // const is a keyword used to declare a constant variable in JavaScript. the variable cannot be reassigned after it's created.

// --- used to split the dashboard and mission control / history from each other ---
const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'history'>('dashboard');

  const [activeMission, setActiveMission] = useState<{location: string, drone: Drone | null, wind: string} | null>(null);
  // const activeMission is a variable, at the start this variable is empty (null). With setActiveMission button you can change the activeMission variable 
  const [pilotName, setPilotName] = useState("");
  // const pilotName is empty at the start, but can be filled using setPilotName()
  const [remarks, setRemarks] = useState("");
  const [takeOffTime, setTakeOffTime] = useState<string | null>(null);
  const [landingTime, setLandingTime] = useState<string | null>(null);
  const [selectedDrone, setSelectedDrone] = useState<Drone | null>(null);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [valMS, setValMS] = useState<string>('');
  const [valKM, setValKM] = useState<string>('');
  const [valKN, setValKN] = useState<string>('');
  const [location, setLocation] = useState('');
  const [searchQuery, setSearchQuery] = useState("");
  const [logs, setLogs] = useState<FlightEntry[]>(() => logService.getLogs());

  // --- 2. WEATHER STATE  ---
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [locationName, setLocationName] = useState<string>("Detecting location..."); //required for converting gps location to name of city

  // --- CONVERSION STATE ---
  const [valFT, setValFT] = useState<string>('');
const [valM, setValM] = useState<string>('');

  // --- 3. WEATHER LOGIC ---
  const handleRefresh = () => {
    if ("geolocation" in navigator) {
      setLoadingWeather(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeatherAndCity(pos.coords.latitude, pos.coords.longitude),
        () => {
          setLocationName("Brussels (Default)");
          fetchWeatherAndCity(50.85, 4.35);
        },
        { enableHighAccuracy: true }
      );
    }
  };

  // --- CONVERSION LOGIC ---
  const updateAltitudeUnits = (value: string, unit: 'ft' | 'm') => {
  const num = parseFloat(value);
  if (isNaN(num)) {
    setValFT('');
    setValM('');
    return;
  }
  if (unit === 'ft') {
    setValFT(value);
    setValM((num * 0.3048).toFixed(1)); // 1 Foot = 0.3048 Meters
  } else if (unit === 'm') {
    setValM(value);
    setValFT((num / 0.3048).toFixed(1)); // 1 Meter = ~3.28084 Feet
  }
};

  const fetchWeatherAndCity = async (lat: number, lon: number) => {
    setLoadingWeather(true);
    try {
      const geoUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
      const geoResp = await fetch(geoUrl);
      const geoData = await geoResp.json();
      
      const city = geoData.city || geoData.locality || "Unknown Location";
      setLocationName(city);
      setLocation(city); 

      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,cloud_cover,visibility,wind_speed_10m,wind_speed_80m,wind_speed_120m,wind_gusts_10m&wind_speed_unit=kmh`;
      const weatherResp = await fetch(weatherUrl);
      const wData = await weatherResp.json();
      const c = wData.current;

      setWeather({
        temp: Math.round(c.temperature_2m),
        precipitation: c.precipitation,
        cloudCover: c.cloud_cover,
        visibility: Math.round(c.visibility / 1000),
        wind10m: Math.round(c.wind_speed_10m),
        wind80m: Math.round(c.wind_speed_80m),
        wind120m: Math.round(c.wind_speed_120m),
        gusts10m: Math.round(c.wind_gusts_10m)
      });

      updateUnits(c.wind_speed_10m.toString(), 'km');
    } catch (error) {
      console.error("Fetch failed:", error);
      setLocationName("Location Error");
    } finally {
      setLoadingWeather(false);
    }
  };

  // Run once on load
  useEffect(() => {
    handleRefresh();
  }, []);

  // --- 4. DATA HANDLERS ---
  const filteredLogs = logs.filter(log => 
    log.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.droneName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.pilot?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const downloadCSV = () => {
    const headers = ["Date", "Location", "Drone", "Pilot", "Wind (km/h)", "Take-Off", "Landing", "Duration", "Safety Score", "Remarks"];
    const rows = filteredLogs.map(log => [
      `"${log.timestamp}"`, `"${log.location}"`, `"${log.droneName}"`, `"${log.pilot || 'N/A'}"`,
      log.windSpeed, log.takeOff || '-', log.landing || '-', log.duration || '-', `${log.safetyScore}%`,
      `"${(log.remarks || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `drone_logbook_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const updateUnits = (value: string, unit: 'ms' | 'km' | 'kn') => {
    const num = parseFloat(value);
    if (isNaN(num)) {
      setValMS(''); setValKM(''); setValKN('');
      return;
    }
    if (unit === 'ms') { setValMS(value); setValKM((num * 3.6).toFixed(1)); setValKN((num * 1.94384).toFixed(1)); }
    else if (unit === 'km') { setValKM(value); setValMS((num / 3.6).toFixed(1)); setValKN((num / 1.852).toFixed(1)); }
    else if (unit === 'kn') { setValKN(value); setValMS((num / 1.94384).toFixed(1)); setValKM((num * 1.852).toFixed(1)); }
  };

  const getSafetyStatus = () => {
    if (!selectedDrone || !valKM) return null;
    const currentWind = parseFloat(valKM);
    const maxWind = selectedDrone.maxWindSpeedKm;
    if (currentWind > maxWind) return { label: 'DANGER: Wind exceeds drone limits!', color: 'bg-red-500', icon: '🛑' };
    if (currentWind > maxWind - 5) return { label: 'CAUTION: Wind near limits.', color: 'bg-yellow-500', icon: '⚠️' };
    return { label: 'SAFE: Wind within limits.', color: 'bg-green-500', icon: '✅' };
  };

  const safety = getSafetyStatus();
  const safetyScore = Math.round((completedTasks.length / riskTasks.length) * 100);
  const isFullyReady = (completedTasks.length === riskTasks.length) && (selectedDrone ? Number(valKM) <= selectedDrone.maxWindSpeedKm : false) && !!selectedDrone;

  const confirmAndSaveLog = () => {
    const newLog: FlightEntry = {
      id: Date.now().toString(),
      location: activeMission?.location || location || "Unknown Location",
      droneName: activeMission?.drone?.name || selectedDrone?.name || "Generic Drone",
      windSpeed: activeMission?.wind || valKM || "0",
      safetyScore: safetyScore,
      timestamp: new Date().toLocaleString(),
      isSafe: isFullyReady, 
      pilot: pilotName,
      remarks: remarks,
      takeOff: takeOffTime || undefined,
      landing: landingTime || undefined,
      duration: (() => {
        if (!takeOffTime || !landingTime) return undefined;
        const [h1, m1] = takeOffTime.split(':').map(Number);
        const [h2, m2] = landingTime.split(':').map(Number);
        const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
        return diff > 0 ? `${diff} min` : "0 min";
      })()
    };
    setLogs(logService.saveLog(newLog));
    setActiveMission(null);
    setPilotName(""); setRemarks(""); setTakeOffTime(null); setLandingTime(null); setLocation(""); setCompletedTasks([]);
  };

  const handleDelete = (id: string) => { if (window.confirm("Delete?")) setLogs(logService.deleteLog(id)); };

  const handleEdit = (log: FlightEntry) => {
    setPilotName(log.pilot || ""); setRemarks(log.remarks || ""); setTakeOffTime(log.takeOff || null); setLandingTime(log.landing || null);
    setLocation(log.location); setValKM(log.windSpeed);
    const drone = droneDatabase.find(d => d.name === log.droneName) || null;
    setSelectedDrone(drone);
    setActiveMission({ location: log.location, drone: drone, wind: log.windSpeed });
    setLogs(logService.deleteLog(log.id));
  };

  const getScoreColor = () => {
    if (safetyScore === 100) return "text-green-400";
    if (safetyScore >= 50) return "text-yellow-400";
    return "text-red-400";
  };

  const handleTaskClick = (id: string) => {
    setCompletedTasks((prev) => {
      if (prev.includes(id)) {
        return prev.filter(taskId => taskId !== id); // Remove if already there
      } else {
        return [...prev, id]; // Add if not there
      }
    });
  };
  
  // Handles the manual time input for take-off
  const handleManualTakeOff = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTakeOffTime(e.target.value);
  };

  // Handles the manual time input for landing
  const handleManualLanding = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLandingTime(e.target.value);
  };

  // Clears the checklist state
  const resetChecklist = () => {
    setCompletedTasks([]);
  };

  // --- 5. START OF THE RETURN FUNCTION = USER INTERFACE (THE VISUAL PART) ---
  return (
  <div className="min-h-screen bg-slate-900 text-white p-4 lg:p-8 font-sans">
    
    {/* =========================================================
       GLOBAL APPLICATION HEADER (Placed at the very top)
       ========================================================= */}
    <header className="max-w-6xl mx-auto mb-8 flex justify-between items-end border-b border-slate-800 pb-4">
      <div>
        <h1 className="text-3xl font-black text-blue-500 tracking-tighter">DRONE <span className="text-white">COPILOT</span></h1>
        <p className="text-slate-400 text-sm">Professional Drone Mission Tool</p>
      </div>

      {/* Navigation Tabs - Only show when NOT actively recording a live flight */}
      {!activeMission && (
        <div className="flex gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button 
            onClick={() => setCurrentScreen('dashboard')} 
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${currentScreen === 'dashboard' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            🎛️ Dashboard
          </button>
          <button 
            onClick={() => setCurrentScreen('history')} 
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${currentScreen === 'history' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            📚 Logs & Mission Control
          </button>
        </div>
      )}
    </header>

    {/* =========================================================
       CONDITIONAL VIEW RENDERER
       ========================================================= */}
    {activeMission ? (
      /* --- VIEW A: FLIGHT LOG RECORDER --- */
      <main className="max-w-3xl mx-auto py-10 animate-in fade-in zoom-in duration-300">
        <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 lg:p-10 shadow-2xl">
          <header className="flex justify-between items-center mb-10 border-b border-slate-700 pb-6">
            <div>
              <h1 className="text-3xl font-black text-blue-500 uppercase italic">In Flight</h1>
              <p className="text-slate-400 font-mono text-sm">{activeMission.location} • {activeMission.drone?.name || "Manual"}</p>
            </div>
            <button onClick={() => setActiveMission(null)} className="text-xs font-bold text-red-500 border border-red-500/20 px-4 py-2 rounded-xl">ABORT</button>
          </header>

          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-slate-500">Pilot in Command</label>
                <input type="text" value={pilotName} onChange={(e) => setPilotName(e.target.value)} placeholder="Name" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white outline-none focus:border-blue-500" />
              </div>
              <div className="space-y-2 md:text-right">
                <label className="text-[10px] uppercase font-bold text-slate-500 block">Wind at Start</label>
                <p className="text-2xl font-black text-blue-400">{activeMission.wind} km/h</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 text-center">
                <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Take-Off</p>
                <input type="time" step="60" value={takeOffTime || ""} onChange={handleManualTakeOff} className="bg-transparent text-3xl font-mono font-bold text-white mb-4 text-center outline-none focus:text-blue-400 w-full cursor-pointer" />
                <button onClick={() => setTakeOffTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }))} className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-bold transition-all active:scale-95">LOG NOW</button>
              </div>
              <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 text-center">
                <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Landing</p>
                <input type="time" step="60" value={landingTime || ""} onChange={handleManualLanding} className="bg-transparent text-3xl font-mono font-bold text-white mb-4 text-center outline-none focus:text-green-400 w-full cursor-pointer" />
                <button onClick={() => setLandingTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }))} className="w-full bg-green-600 hover:bg-green-500 py-4 rounded-xl font-bold transition-all active:scale-95">LOG NOW</button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-500">Remarks</label>
              <textarea rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Battery % or incidents..." className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white outline-none" />
            </div>

            <button onClick={confirmAndSaveLog} className="w-full bg-blue-500 hover:bg-blue-400 text-white py-5 rounded-2xl font-black text-xl shadow-xl transition-all">
              COMPLETE & SAVE LOG
            </button>
          </div>
        </div>
      </main>
    ) : (
      /* --- DASHBOARD & HISTORY HUB CONTENT --- */
      <main className="max-w-6xl mx-auto">
        {currentScreen === 'dashboard' ? (
  /* =========================================================
     SCREEN 1: NEW REARRANGED DASHBOARD LAYOUT
     ========================================================= */
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
    
    {/* ----------------------------
       LEFT COLUMN: AIRCRAFT FOCUS
       ---------------------------- */}
    <div className="lg:col-span-5 space-y-6">
      
      {/* 01 SELECT ACTIVE AIRCRAFT */}
      <section className="bg-blue-600 p-1 rounded-2xl shadow-xl shadow-blue-900/20">
        <div className="bg-slate-800 p-5 rounded-[calc(1rem-1px)]">
          <h2 className="text-sm font-bold mb-4 text-blue-400 uppercase tracking-widest flex items-center gap-2">
            <span className="p-1 bg-blue-500/20 rounded text-blue-400 text-xs">01</span> Select Active Aircraft
          </h2>
          <select 
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-lg font-bold text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
            onChange={(e) => setSelectedDrone(droneDatabase.find(d => d.id === e.target.value) || null)} 
            value={selectedDrone?.id || ""}
          >
            <option value="">-- NO DRONE SELECTED --</option>
            {droneDatabase.map(drone => <option key={drone.id} value={drone.id}>{drone.name}</option>)}
          </select>
        </div>
      </section>

      {/* 02 AIRCRAFT SPECS */}
      {selectedDrone ? (
        <section className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700 animate-in fade-in duration-300">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="p-1 bg-slate-500/10 rounded text-slate-400 text-xs">02</span> Aircraft Specs
            </h2>
            <span className="text-[10px] text-slate-500 font-mono font-bold">{selectedDrone.id.toUpperCase()}</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Max Wind", value: `${selectedDrone.maxWindSpeedKm} km/h` },
              { label: "IP Rating", value: selectedDrone.IPrating },
              { label: "Thermal", value: selectedDrone.ThermalCam },
              { label: "Weight", value: `${selectedDrone.weight}g` },
              { label: "Max Speed", value: `${selectedDrone.MaxSpeedKm} km/h` },
              { label: "Flighttime", value: `${selectedDrone.MaxFlightTime} min` }
            ].map((spec, i) => (
              <div key={i} className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <p className="text-slate-500 text-[9px] uppercase font-bold tracking-wider">{spec.label}</p>
                <p className="text-lg font-bold text-white mt-1">{spec.value}</p>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="bg-slate-800/20 p-8 rounded-2xl border border-dashed border-slate-700 text-center text-slate-500 text-xs font-bold uppercase tracking-wider">
          Please select an aircraft to view performance specifications.
        </section>
      )}
      {/* 03 ENVIRONMENT */}
      <section className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700 backdrop-blur-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span className="p-1 bg-slate-500/10 rounded text-slate-400 text-xs">03</span> Environment
          </h2>
          <p className="flex items-center gap-2 text-blue-400 font-black text-xs mt-1 uppercase">
            <MapPin className="w-3.5 h-3.5" /> 
            <span>{locationName}</span>
          </p>
          <button 
            onClick={handleRefresh}
            disabled={loadingWeather}
            className={`text-[10px] bg-slate-700 hover:bg-slate-600 text-slate-300 px-2 py-0.5 rounded-md transition-all active:scale-95 flex items-center gap-1 ${loadingWeather ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loadingWeather ? '...' : <><RefreshCw className="w-3 h-3 text-blue-400" /> REFRESH</>}
          </button>
        </div>

        {weather && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800/50"><p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Visibility</p><p className="text-sm font-bold text-white">{weather?.visibility} km</p></div>
              <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800/50"><p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Cloud Cover</p><p className="text-sm font-bold text-white">{weather?.cloudCover}%</p></div>
              <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800/50"><p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Precipitation</p><p className="text-sm font-bold text-white">{weather?.precipitation} mm</p></div>
              <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800/50"><p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Gusts (10m)</p><p className="text-sm font-bold text-orange-400">{weather?.gusts10m} km/h</p></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-2 bg-blue-500/5 rounded-lg border border-blue-500/20"><p className="text-[8px] text-blue-400 font-bold uppercase mb-1">Wind 10m</p><p className="text-sm font-black font-mono">{weather?.wind10m} <span className="text-[10px]">km/h</span></p></div>
              <div className="text-center p-2 bg-blue-500/10 rounded-lg border border-blue-500/30"><p className="text-[8px] text-blue-400 font-bold uppercase mb-1">Wind 80m</p><p className="text-sm font-black font-mono">{weather?.wind80m} <span className="text-[10px]">km/h</span></p></div>
              <div className="text-center p-2 bg-blue-500/20 rounded-lg border border-blue-500/40"><p className="text-[8px] text-blue-400 font-bold uppercase mb-1">Wind 120m</p><p className="text-sm font-black font-mono">{weather?.wind120m} <span className="text-[10px]">km/h</span></p></div>
            </div>
          </>
        )}
      </section>

  {/* WIND ANALYSIS DATA ALERTS */}
      {safety && (
        <div className={`${safety.color} p-5 rounded-2xl text-white shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-2 duration-300`}>
          <span className="text-3xl bg-white/20 p-2 rounded-full">{safety.icon}</span>
          <div>
            <h3 className="font-black uppercase leading-tight">Wind Analysis</h3>
            <p className="text-sm opacity-90">{safety.label}</p>
          </div>
        </div>
      )}

    </div>

    {/* ----------------------------------
       RIGHT COLUMN: CONDITIONS & SAFETY
       ---------------------------------- */}
    <div className="lg:col-span-7 space-y-6">

      {/* 04 CONVERSIONS */}
      <section className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700 backdrop-blur-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span className="p-1 bg-slate-500/10 rounded text-slate-400 text-xs">04</span> Conversions
          </h2>
        </div>
        <div className="mb-4">
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-2">💨 Wind Speed</p>
          <div className="grid grid-cols-3 gap-3">
            {['ms', 'km', 'kn'].map((unit) => (
              <div key={unit}>
                <label className="block text-[9px] uppercase text-slate-500 mb-1 font-bold">{unit === 'ms' ? 'm/s' : unit === 'km' ? 'km/h' : 'knots'}</label>
                <input type="number" value={unit === 'ms' ? valMS : unit === 'km' ? valKM : valKN} onChange={(e) => updateUnits(e.target.value, unit as any)} placeholder="0" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-blue-500 transition-all font-mono font-bold" />
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-2">🏔️ Altitude / Distance</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] uppercase text-slate-500 mb-1 font-bold">Feet (ft)</label>
              <input type="number" value={valFT} onChange={(e) => updateAltitudeUnits(e.target.value, 'ft')} placeholder="0" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-blue-500 transition-all font-mono font-bold" />
            </div>
            <div>
              <label className="block text-[9px] uppercase text-slate-500 mb-1 font-bold">Meters (m)</label>
              <input type="number" value={valM} onChange={(e) => updateAltitudeUnits(e.target.value, 'm')} placeholder="0" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-blue-500 transition-all font-mono font-bold" />
            </div>
          </div>
        </div>
      </section>

      {/* 05 RISK ASSESSMENT */}
      <section className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700">
        <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="p-1 bg-blue-500/20 rounded text-blue-400 text-xs font-mono">05</span>
              <Shield className="w-5 h-5 text-blue-400" /> Risk Assessment
            </h2>
            <p className="text-[10px] uppercase tracking-widest font-bold mt-1 text-slate-500">
              Readiness: <span className={getScoreColor()}>{safetyScore}%</span>
            </p>
          </div>
          {completedTasks.length > 0 && (
            <button onClick={resetChecklist} className="text-xs font-bold text-slate-400 hover:text-red-400 transition-colors flex items-center gap-1 cursor-pointer">
              <ListRestart className="w-5 h-5 text-blue-400" /> RESET
            </button>
          )}
        </div>
        <div className="space-y-2">
          {riskTasks.map((task) => (
            <div key={task.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${completedTasks.includes(task.id) ? "bg-green-500/10 border-green-500/40" : "bg-slate-900/50 border-slate-800"}`}>
              <span className="text-sm text-slate-300">{task.label}</span>
              <button onClick={() => { if (task.url !== '#') window.open(task.url, '_blank'); handleTaskClick(task.id); }} className={`text-[10px] font-bold px-3 py-1 rounded-full transition-colors ${completedTasks.includes(task.id) ? "bg-green-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}>
                {completedTasks.includes(task.id) ? "CHECKED" : "CHECK"}
              </button>
            </div>
          ))}
        </div>
      </section>


      {/* FINAL CLEARANCE NOTIFICATION BANNER */}
      <div className={`p-6 rounded-2xl border-2 transition-all duration-500 flex flex-col items-center justify-center text-center gap-2 ${isFullyReady ? "bg-green-500/15 border-green-500" : "bg-slate-800 border-slate-700"}`}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{isFullyReady ? "🚀" : "🛑"}</span>
          <h3 className={`text-2xl font-black uppercase tracking-tighter ${isFullyReady ? "text-green-400" : "text-white"}`}>
            {isFullyReady ? "Safe to Fly" : "Not Ready to Fly"}
          </h3>
        </div>
        <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
          {isFullyReady ? "All checks ok • Environment within limits" : "Complete checklist or wind limits exceeded"}
        </p>
      </div>

    </div>
  </div>
) : (
          /* SCREEN 2: LOG RECORDING & HISTORY */
          <div className="space-y-6 animate-in fade-in duration-200 max-w-4xl mx-auto">
            {/* 05 MISSION CONTROL */}
            <section className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-xl">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">05 Mission Control</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="md:col-span-2">
                  <input type="text" placeholder="Mission Location" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl py-4 px-6 text-white outline-none focus:border-blue-500 transition-all" />
                </div>
                <div>
                  <button onClick={() => setActiveMission({location: location || "Untitled", drone: selectedDrone, wind: valKM || "0"})} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-black text-md shadow-lg active:scale-95 transition-all uppercase">
                    Start Flight Log Recorder 🚀
                  </button>
                </div>
              </div>
            </section>

            {/* 06 MISSION HISTORY */}
            <section className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">06 Mission History</h2>
                <div className="flex items-center gap-3">
                  {filteredLogs.length > 0 && (
                    <button onClick={downloadCSV} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2">
                      <span>📥</span> EXCEL / CSV
                    </button>
                  )}
                  <div className="relative w-full sm:w-64">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
                    <input type="text" placeholder="Search missions..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm text-white outline-none focus:border-blue-500 transition-all" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map(log => (
                    <div key={log.id} className="group bg-slate-900/80 p-5 rounded-xl border border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 hover:border-slate-600 transition-all">
                      <div className="flex gap-4 items-center w-full md:w-auto">
                        <div className={`w-2 h-10 rounded-full ${log.isSafe ? 'bg-green-500' : 'bg-yellow-500'}`} />
                        <div>
                          <p className="font-bold text-white text-lg">{log.location}</p>
                          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">{log.timestamp} • {log.droneName}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-6 items-center w-full md:w-auto justify-between md:justify-end">
                        <div className="flex gap-6">
                          <div className="text-center"><p className="text-[9px] uppercase text-slate-500 font-bold tracking-widest">In-Air</p><p className="text-xs text-blue-400 font-mono">{log.duration || '--'}</p></div>
                          <div className="text-center"><p className="text-[9px] uppercase text-slate-500 font-bold tracking-widest">Wind</p><p className="text-xs text-blue-400 font-mono">{log.windSpeed} km/h</p></div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleEdit(log)} className="p-2 bg-slate-800 hover:bg-blue-600 rounded-lg text-sm transition-colors">✏️</button>
                          <button onClick={() => handleDelete(log.id)} className="p-2 bg-slate-800 hover:bg-red-600 rounded-lg text-sm transition-colors">🗑️</button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 border-2 border-dashed border-slate-800 rounded-2xl">
                    <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">No missions found matching "{searchQuery}"</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    )}
  </div>
);
}

export default App;