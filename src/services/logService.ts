import type { Drone } from '../drones';

export interface WeatherData {
  temp: number;
  precipitation: number;
  cloudCover: number;
  visibility: number;
  wind10m: number;
  wind80m: number;
  wind120m: number;
  gusts10m: number;
}

export interface FlightEntry {
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

const STORAGE_KEY = 'drone_logs';

export const logService = {
  // GET ALL LOGS
  getLogs: (): FlightEntry[] => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  },

  // SAVE A NEW LOG
  saveLog: (log: FlightEntry): FlightEntry[] => {
    const logs = logService.getLogs();
    const updatedLogs = [log, ...logs];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLogs));
    return updatedLogs;
  },

  // DELETE A LOG
  deleteLog: (id: string): FlightEntry[] => {
    const logs = logService.getLogs();
    const updatedLogs = logs.filter(log => log.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLogs));
    return updatedLogs;
  },

  // UPDATE AN EXISTING LOG (For the Edit feature)
  updateLog: (updatedLog: FlightEntry): FlightEntry[] => {
    const logs = logService.getLogs();
    const updatedLogs = logs.map(log => log.id === updatedLog.id ? updatedLog : log);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLogs));
    return updatedLogs;
  }
};