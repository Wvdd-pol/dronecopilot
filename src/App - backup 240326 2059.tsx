//IMPORTS
import { useState, useEffect } from 'react';
import { droneDatabase, type Drone } from './drones';

//STATIC DATA OUTSIDE THE FUNCTION
const riskTasks = [
  { id: 'weather', label: 'Check Local Weather', url: 'https://www.windy.com' },
  { id: 'airspace', label: 'Check Airspace Restrictions', url: 'https://map.droneguide.be/' },
  { id: 'notams', label: 'Review NOTAMs', url: 'https://www.notams.faa.gov' },
  { id: 'hardware', label: 'Check Drone Hardware (Props/Battery)', url: '#' },
  { id: 'landing', label: 'Check Landing Zone (Flat/Clear)', url: '#' },
  { id: 'hazmat', label: 'Check Hazardous Materials/Interference', url: '#' },
  { id: 'obstacles', label: 'Check Obstacles in Flight Path', url: '#' },
  { id: 'fitness', label: 'Do I feel fit to fly? (I’M SAFE)', url: '#' },
];

//USED FOR THE FLIGHT LOG
interface FlightEntry {
  id: number;
  droneName: string;
  location: string;
  windSpeed: string;
  timestamp: string;
}

//START OF THE APPLICATION CODE APP()
function App() {

//STATING ALL VARIABLES WITH CONST - STATING ALL VARIABLES WITH CONST - STATING ALL VARIABLES WITH CONST - STATING ALL VARIABLES WITH CONST
// Defines 'selectedDrone'.
const [selectedDrone, setSelectedDrone] = useState<Drone | null>(null);
// This stores an array of task IDs that have been clicked
const [completedTasks, setCompletedTasks] = useState<string[]>([]);
//?
//USED TO CALCULATE METER/S TO KM/H AND KNOTS
const [valMS, setValMS] = useState<string>('');
const [valKM, setValKM] = useState<string>('');
const [valKN, setValKN] = useState<string>('');
const [location, setLocation] = useState('');

//LOG STATE WITH INITIAL LOAD
const [logs, setLogs] = useState<FlightEntry[]>(() => {
  // This runs ONCE when the app starts
const savedLogs = localStorage.getItem('drone_logs');
  return savedLogs ? JSON.parse(savedLogs) : [];
});

// 3. THE WATCHMAN (Saves to memory whenever 'logs' changes)
  useEffect(() => {
    localStorage.setItem('drone_logs', JSON.stringify(logs));
  }, [logs]);

  // 4. LOGIC FUNCTIONS
  const handleTaskClick = (id: string) => {
  setCompletedTasks((prev) => 
    prev.includes(id) 
      ? prev.filter(taskId => taskId !== id) // Remove if already there
      : [...prev, id]                        // Add if not there
  );
};
const updateUnits = (value: string, unit: 'ms' | 'km' | 'kn') => {
  const num = parseFloat(value);
  if (isNaN(num)) {
    setValMS(''); setValKM(''); setValKN('');
    return;
  }
  if (unit === 'ms') {
    setValMS(value);
    setValKM((num * 3.6).toFixed(1));
    setValKN((num * 1.94384).toFixed(1));
  } else if (unit === 'km') {
    setValKM(value);
    setValMS((num / 3.6).toFixed(1));
    setValKN((num / 1.852).toFixed(1));
  } else if (unit === 'kn') {
    setValKN(value);
    setValMS((num / 1.94384).toFixed(1));
    setValKM((num * 1.852).toFixed(1));
  }
};

//USED TO CHECK THE DRONE MAX WIND SPEED VS THE REAL WEATHER WIND SPEED
const getSafetyStatus = () => {
  if (!selectedDrone || !valKM) return null;
//?
const currentWind = parseFloat(valKM);
const maxWind = selectedDrone.maxWindSpeedKm;
  if (currentWind > maxWind) {
    return { label: 'DANGER: Wind exceeds drone limits!', color: 'bg-red-500', icon: '🛑' };
  } else if (currentWind > maxWind - 5) {
    return { label: 'CAUTION: Wind near limits.', color: 'bg-yellow-500', icon: '⚠️' };
  } else {
    return { label: 'SAFE: Wind within limits.', color: 'bg-green-500', icon: '✅' };
  }
};
//?
const safety = getSafetyStatus();

const saveFlight = () => {
  if (!selectedDrone || !location) {
    alert("Please select a drone and enter a location.");
    return;
  }
 const newLog: FlightEntry = {
    id: Date.now(),
    droneName: selectedDrone.name,
    location: location,
    windSpeed: valKM || '0',
    timestamp: new Date().toLocaleString()
  };
  setLogs([newLog, ...logs]); // Adds new log to the top of the list
  setLocation(''); // Clears the input field
};

// used to reset the checklist
const resetChecklist = () => {
  if (completedTasks.length > 0) {
    setCompletedTasks([]);
  }
};

// Calculate percentage of completed tasks
const safetyScore = Math.round((completedTasks.length / riskTasks.length) * 100);

// Determine the color based on the score
const getScoreColor = () => {
  if (safetyScore === 100) return "text-green-400";
  if (safetyScore >= 50) return "text-yellow-400";
  return "text-red-400";
};

//RETURN STATEMENTS - START OF UI - RETURN STATEMENTS - START OF UI - RETURN STATEMENTS - START OF UI - RETURN STATEMENTS - START OF UI - RETURN STATEMENTS - START OF UI

 return (
  <div className="min-h-screen bg-slate-900 text-white p-4 lg:p-8 font-sans">
    <header className="max-w-6xl mx-auto mb-8 flex justify-between items-end border-b border-slate-800 pb-4">
      <div>
        <h1 className="text-3xl font-black text-blue-500 tracking-tighter">DRONE <span className="text-white">COPILOT</span></h1>
        <p className="text-slate-400 text-sm">Professional Drone Mission Tool</p>
      </div>
      <div className="text-right hidden sm:block">
        <p className="text-xs text-slate-500 uppercase">System Status</p>
        <p className="text-xs text-green-500 font-bold">● ONLINE</p>
      </div>
    </header>

    <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* LEFT COLUMN: PRE-FLIGHT PREP (40% width on desktop) */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* UNIT CONVERTER */}
        <section className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700 backdrop-blur-sm">
          <h2 className="text-sm font-bold mb-4 text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span className="p-1 bg-blue-500/20 rounded text-blue-400 text-xs">01</span> 
            Environmental Input
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] uppercase text-slate-500 mb-1">m/s</label>
              <input type="number" value={valMS} onChange={(e) => updateUnits(e.target.value, 'ms')} placeholder="0" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-slate-500 mb-1">km/h</label>
              <input type="number" value={valKM} onChange={(e) => updateUnits(e.target.value, 'km')} placeholder="0" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-slate-500 mb-1">Knots</label>
              <input type="number" value={valKN} onChange={(e) => updateUnits(e.target.value, 'kn')} placeholder="0" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none transition-all" />
            </div>
          </div>
        </section>

        {/* RISK CHECKLIST */}
        <section className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700">
          <h2 className="text-sm font-bold mb-4 text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span className="p-1 bg-blue-500/20 rounded text-blue-400 text-xs">02</span> 
            Risk Analysis
          </h2>

<section className="bg-slate-800/30 p-6 rounded-2xl border border-slate-700">
  {/* HEADER: Title and Reset Button */}
  <div className="flex justify-between items-center mb-6">
  <div className="flex flex-col">
    <h2 className="text-xl font-bold flex items-center gap-2">
      <span>🛡️</span> Risk Assessment
    </h2>
    {/* The Safety Score Subtitle */}
    <p className="text-[10px] uppercase tracking-widest font-bold mt-1 text-slate-500">
      Readiness: <span className={getScoreColor()}>{safetyScore}%</span>
    </p>
  </div>
  
  {completedTasks.length > 0 && (
    <button 
      onClick={resetChecklist}
      className="text-xs font-bold text-slate-400 hover:text-red-400 transition-colors flex items-center gap-1 cursor-pointer"
    >
      <span>🔄</span> RESET
    </button>
  )}
</div>

  {/* LIST: Maps through your tasks once */}
  <div className="space-y-2">
    {riskTasks.map((task) => {
      const isCompleted = completedTasks.includes(task.id);
      return (
        <div 
          key={task.id} 
          className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${
            isCompleted 
              ? "bg-green-500/10 border-green-500/40" 
              : "bg-slate-900/50 border-slate-800"
          }`}
        >
          <span className={`text-sm ${isCompleted ? "text-green-400 font-medium" : "text-slate-300"}`}>
            {task.label} {isCompleted && "✓"}
          </span>
          
         <a 
  href={task.url} 
  target={task.url === '#' ? '_self' : '_blank'} 
  rel="noopener noreferrer" 
  onClick={(e) => {
    if (task.url === '#') e.preventDefault();
    handleTaskClick(task.id);
  }} 
  className={`text-[10px] font-bold px-3 py-1 rounded-full transition-all cursor-pointer ${
    isCompleted 
      ? "bg-green-600 hover:bg-red-500 text-white" // Turns red on hover to signal "Uncheck"
      : "bg-slate-700 hover:bg-blue-600 text-slate-200"
  }`}
>
  {/* The label logic */}
  {isCompleted ? "UNCHECK" : (task.url === '#' ? "CHECK" : "OPEN")}
</a>
        </div>
      );
    })}
  </div>
</section>

        </section>
      </div>

      {/* RIGHT COLUMN: AIRCRAFT & SAFETY (60% width on desktop) */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* DRONE SELECTOR */}
        <section className="bg-blue-600 p-1 rounded-2xl shadow-xl shadow-blue-900/20">
          <div className="bg-slate-800 p-5 rounded-[calc(1rem-1px)]">
            <label className="block text-xs font-bold mb-3 text-blue-400 uppercase">Select Active Aircraft</label>
            <select 
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-lg font-bold text-white outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setSelectedDrone(droneDatabase.find(d => d.id === e.target.value) || null)}
            >
              <option value="">-- NO DRONE SELECTED --</option>
              {droneDatabase.map(drone => <option key={drone.id} value={drone.id}>{drone.name}</option>)}
            </select>
          </div>
        </section>

        {/* SAFETY ALERT (Conditional) */}
        {safety && (
          <div className={`${safety.color} p-5 rounded-2xl text-white shadow-2xl flex items-center gap-4 transition-all transform hover:scale-[1.01]`}>
            <span className="text-4xl bg-white/20 p-2 rounded-full">{safety.icon}</span>
            <div>
              <h3 className="font-black text-lg leading-tight uppercase">Wind Analysis</h3>
              <p className="font-medium opacity-90">{safety.label}</p>
            </div>
          </div>
        )}

        {/* SPECIFICATIONS GRID */}
        {selectedDrone && (
          <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
             <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
                <p className="text-slate-500 text-[10px] uppercase font-bold">Max Wind</p>
                <p className="text-xl font-bold text-white">{selectedDrone.maxWindSpeedKm}<span className="text-xs ml-1 text-slate-500">km/h - </span>
                {selectedDrone.maxWindSpeedM}<span className="text-xs ml-1 text-slate-500">m/s</span></p>
             </div>
             <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
                <p className="text-slate-500 text-[10px] uppercase font-bold">IP Rating</p>
                <p className="text-xl font-bold text-white">{selectedDrone.IPrating}</p>
             </div>
             <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
                <p className="text-slate-500 text-[10px] uppercase font-bold">Thermal</p>
                <p className="text-xl font-bold text-white">{selectedDrone.ThermalCam}</p>
             </div>
             <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
                <p className="text-slate-500 text-[10px] uppercase font-bold">Weight</p>
                <p className="text-xl font-bold text-white">{selectedDrone.weight}<span className="text-xs ml-1 text-slate-500">gram </span></p>
             </div>
              <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
                <p className="text-slate-500 text-[10px] uppercase font-bold">Max speed</p>
                <p className="text-xl font-bold text-white">{selectedDrone.MaxSpeedKm}<span className="text-xs ml-1 text-slate-500">km/h - </span>
                {selectedDrone.MaxSpeedM}<span className="text-xs ml-1 text-slate-500">m/s</span></p>
             </div>
              <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
                <p className="text-slate-500 text-[10px] uppercase font-bold">Flighttime</p>
                <p className="text-xl font-bold text-white">{selectedDrone.MaxFlightTime}<span className="text-xs ml-1 text-slate-500">minutes </span></p>
             </div>
             {/* Add more spec cards here as needed */}
          </section>
        )}
      </div>

{/* SECTION: FLIGHT LOG (Full Width) */}
<section className="lg:col-span-12 bg-slate-800/30 p-6 rounded-2xl border border-slate-700 mt-4">
  <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
    <span>📋</span> Mission Logbook
  </h2>

  <div className="flex flex-col md:flex-row gap-4 mb-8">
    <input 
      type="text" 
      placeholder="Mission Location (e.g. Central Park)" 
      value={location}
      onChange={(e) => setLocation(e.target.value)}
      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-blue-500"
    />
    <button 
      onClick={saveFlight}
      className="bg-blue-600 hover:bg-blue-500 px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20"
    >
      Log Flight
    </button>
  </div>

  <div className="space-y-3">
    {logs.length === 0 ? (
      <p className="text-slate-500 text-center py-10 border-2 border-dashed border-slate-700 rounded-xl">No flights logged yet.</p>
    ) : (
      logs.map(log => (
        <div key={log.id} className="bg-slate-900 p-4 rounded-xl border-l-4 border-green-500 flex justify-between items-center animate-in slide-in-from-left">
          <div>
            <p className="font-bold text-lg">{log.location}</p>
            <p className="text-xs text-slate-500">{log.timestamp} • {log.droneName}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase text-slate-500 font-bold tracking-widest">Wind</p>
            <p className="font-mono text-blue-400">{log.windSpeed} km/h</p>
          </div>
        </div>
      ))
    )}
  </div>
</section>


    </main>
  </div>
);
}

export default App;
