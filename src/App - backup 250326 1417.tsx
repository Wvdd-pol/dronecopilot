//IMPORTS
import { useState, useEffect } from 'react';
import { droneDatabase, type Drone } from './drones';

//STATIC DATA
const riskTasks = [
  { id: 'weather', label: 'Check Local Weather', url: 'https://www.windy.com' },
  { id: 'airspace', label: 'Check Airspace Restrictions', url: 'https://map.droneguide.be/' },
  { id: 'notams', label: 'Review NOTAMs', url: 'https://notaminfo.com/belgiummap' },
  { id: 'ads-b', label: 'Review ADS-B (airspace)', url: 'https://globe.adsbexchange.com/' },
  { id: 'hardware', label: 'Check Drone Hardware (Props/Battery)', url: '#' },
  { id: 'landing', label: 'Check Landing Zone (Flat/Clear)', url: '#' },
  { id: 'hazmat', label: 'Check Hazardous Materials/Interference', url: '#' },
  { id: 'obstacles', label: 'Check Obstacles in Flight Path', url: '#' },
  { id: 'fitness', label: 'Do I feel fit to fly? (I’M SAFE)', url: '#' },
];

interface FlightEntry {
  id: string;
  droneName: string;
  location: string;
  windSpeed: string;
  timestamp: string;
  isSafe: boolean;
  safetyScore: number;
  pilot?: string;      
  remarks?: string;    
  takeOff?: string;    
  landing?: string;
  duration?: string;
}

function App() {
  // --- STATE ---
  const [activeMission, setActiveMission] = useState<{location: string, drone: Drone | null, wind: string} | null>(null);
  const [pilotName, setPilotName] = useState("");
  const [remarks, setRemarks] = useState("");
  const [takeOffTime, setTakeOffTime] = useState<string | null>(null);
  const [landingTime, setLandingTime] = useState<string | null>(null);

  const [selectedDrone, setSelectedDrone] = useState<Drone | null>(null);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [valMS, setValMS] = useState<string>('');
  const [valKM, setValKM] = useState<string>('');
  const [valKN, setValKN] = useState<string>('');
  const [location, setLocation] = useState('');

  const [logs, setLogs] = useState<FlightEntry[]>(() => {
    const savedLogs = localStorage.getItem('drone_logs');
    return savedLogs ? JSON.parse(savedLogs) : [];
  });

  useEffect(() => {
    localStorage.setItem('drone_logs', JSON.stringify(logs));
  }, [logs]);

  // --- LOGIC ---
  const handleTaskClick = (id: string) => {
    setCompletedTasks((prev) => 
      prev.includes(id) ? prev.filter(taskId => taskId !== id) : [...prev, id]
    );
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
  const isChecklistComplete = completedTasks.length === riskTasks.length;
  const isWindWithinLimits = selectedDrone ? Number(valKM) <= selectedDrone.maxWindSpeedKm : false;
  
  // Master Logic
  const isFullyReady = isChecklistComplete && isWindWithinLimits && !!selectedDrone;

  const calculateDuration = () => {
    if (!takeOffTime || !landingTime) return undefined;
    const [h1, m1] = takeOffTime.split(':').map(Number);
    const [h2, m2] = landingTime.split(':').map(Number);
    const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    return diff > 0 ? `${diff} min` : "0 min";
  };

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
      duration: calculateDuration()
    };

    setLogs([newLog, ...logs]);
    setActiveMission(null);
    setPilotName(""); setRemarks(""); setTakeOffTime(null); setLandingTime(null); setLocation("");
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 lg:p-8 font-sans">
      
      {activeMission ? (
        /* --- VIEW A: FLIGHT RECORDER --- */
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
                  <p className="text-xs font-bold text-slate-500 mb-2 uppercase">Take-Off</p>
                  <div className="text-3xl font-mono font-bold text-white mb-4">{takeOffTime || "--:--"}</div>
                  <button onClick={() => setTakeOffTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))} className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-bold transition-all active:scale-95">LOG TAKEOFF</button>
                </div>
                <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 text-center">
                  <p className="text-xs font-bold text-slate-500 mb-2 uppercase">Landing</p>
                  <div className="text-3xl font-mono font-bold text-white mb-4">{landingTime || "--:--"}</div>
                  <button onClick={() => setLandingTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))} className="w-full bg-green-600 hover:bg-green-500 py-4 rounded-xl font-bold transition-all active:scale-95">LOG LANDING</button>
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
        /* --- DASHBOARD VIEW --- */
        <>
          <header className="max-w-6xl mx-auto mb-8 flex justify-between items-end border-b border-slate-800 pb-4">
            <div>
              <h1 className="text-3xl font-black text-blue-500 tracking-tighter">DRONE <span className="text-white">COPILOT</span></h1>
              <p className="text-slate-400 text-sm">Professional Drone Mission Tool</p>
            </div>
          </header>

          <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN */}
            <div className="lg:col-span-5 space-y-6">
              <section className="bg-blue-600 p-1 rounded-2xl shadow-xl shadow-blue-900/20">
                <div className="bg-slate-800 p-5 rounded-[calc(1rem-1px)]">
                  <h2 className="text-sm font-bold mb-4 text-blue-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="p-1 bg-blue-500/20 rounded text-blue-400 text-xs">01</span> Active Aircraft
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

              <section className={`bg-slate-800/50 p-6 rounded-2xl border transition-all duration-500 ${safetyScore === 100 ? "border-green-500/50" : "border-slate-700"}`}>
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">02 Risk Analysis ({safetyScore}%)</h2>
                  <button onClick={() => setCompletedTasks([])} className="text-[10px] font-bold text-slate-500 hover:text-red-400">RESET</button>
                </div>
                <div className="space-y-2">
                  {riskTasks.map((task) => (
                    <div key={task.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${completedTasks.includes(task.id) ? "bg-green-500/10 border-green-500/40" : "bg-slate-900/50 border-slate-800"}`}>
                      <span className="text-sm text-slate-300">{task.label}</span>
                      <button onClick={() => { if (task.url !== '#') window.open(task.url, '_blank'); handleTaskClick(task.id); }} className={`text-[10px] font-bold px-3 py-1 rounded-full ${completedTasks.includes(task.id) ? "bg-green-600" : "bg-slate-700"}`}>
                        {completedTasks.includes(task.id) ? "DONE" : "CHECK"}
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* RIGHT COLUMN */}
            <div className="lg:col-span-7 space-y-6">
              <section className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700 backdrop-blur-sm">
                <h2 className="text-sm font-bold mb-4 text-slate-400 uppercase tracking-widest">03 Environment</h2>
                <div className="grid grid-cols-3 gap-3">
                  {['ms', 'km', 'kn'].map((unit) => (
                    <div key={unit}>
                      <label className="block text-[10px] uppercase text-slate-500 mb-1">{unit === 'ms' ? 'm/s' : unit === 'km' ? 'km/h' : 'knots'}</label>
                      <input type="number" value={unit === 'ms' ? valMS : unit === 'km' ? valKM : valKN} onChange={(e) => updateUnits(e.target.value, unit as any)} placeholder="0" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-blue-500" />
                    </div>
                  ))}
                </div>
              </section>

              {safety && (
                <div className={`${safety.color} p-5 rounded-2xl text-white shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-left-4`}>
                  <span className="text-3xl bg-white/20 p-2 rounded-full">{safety.icon}</span>
                  <div>
                    <h3 className="font-black uppercase leading-tight">Wind Analysis</h3>
                    <p className="text-sm opacity-90">{safety.label}</p>
                  </div>
                </div>
              )}

              {/* RESTORED MASTER READINESS BANNER */}
              <div className={`p-6 rounded-2xl border-2 transition-all duration-500 flex flex-col items-center justify-center text-center gap-2 ${
                isFullyReady 
                  ? "bg-green-500/15 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)]" 
                  : "bg-slate-800 border-slate-700 shadow-inner"
              }`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{isFullyReady ? "🚀" : "🛑"}</span>
                  <h3 className={`text-2xl font-black uppercase tracking-tighter ${isFullyReady ? "text-green-400" : "text-white"}`}>
                    {isFullyReady ? "Safe to Fly" : "Not Ready to Fly"}
                  </h3>
                </div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                  {isFullyReady 
                    ? "All systems nominal • Environment within limits" 
                    : "Complete checklist or wind limits exceeded"}
                </p>
              </div>

              {/* SPECIFICATIONS */}
              {selectedDrone && (
                <section className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700 animate-in zoom-in duration-300">
                  <h2 className="text-sm font-bold mb-4 text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="p-1 bg-blue-500/20 rounded text-blue-400 text-xs">04</span> Aircraft Specs
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
              )}

              <section className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">05 Mission Control</h2>
                <div className="flex flex-col gap-4">
                  <input type="text" placeholder="Mission Location" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl py-4 px-6 text-white outline-none focus:border-blue-500 transition-all" />
                  <button 
                    onClick={() => setActiveMission({location: location || "Untitled", drone: selectedDrone, wind: valKM || "0"})} 
                    className="bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-black text-lg shadow-lg active:scale-95 transition-all uppercase"
                  >
                    Start Flight Recorder 🚀
                  </button>
                </div>
              </section>
            </div>

            {/* LOGBOOK */}
            <section className="lg:col-span-12 bg-slate-800/50 p-6 rounded-2xl border border-slate-700 mt-4">
               <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">06 Mission History</h2>
               <div className="space-y-4">
                {logs.map(log => (
                  <div key={log.id} className="bg-slate-900/80 p-5 rounded-xl border border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex gap-4 items-center w-full md:w-auto">
                      <div className={`w-2 h-10 rounded-full ${log.isSafe ? 'bg-green-500' : 'bg-yellow-500'}`} />
                      <div>
                        <p className="font-bold text-white text-lg">{log.location}</p>
                        <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">{log.timestamp} • {log.droneName}</p>
                      </div>
                    </div>
                    <div className="flex gap-8 items-center w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-800 pt-3 md:pt-0">
                      <div className="text-center">
                        <p className="text-[9px] uppercase text-slate-500 font-bold tracking-widest">In-Air</p>
                        <p className="text-xs text-blue-400 font-mono">{log.duration || '--'}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] uppercase text-slate-500 font-bold tracking-widest">Wind</p>
                        <p className="text-xs text-blue-400 font-mono">{log.windSpeed} km/h</p>
                      </div>
                      <div className={`px-3 py-1 rounded text-[10px] font-black tracking-widest ${log.isSafe ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                        {log.isSafe ? 'NOMINAL' : 'RISK TAKEN'}
                      </div>
                    </div>
                  </div>
                ))}
               </div>
            </section>
          </main>
        </>
      )}
    </div>
  );
}

export default App;