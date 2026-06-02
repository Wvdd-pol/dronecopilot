export interface Drone {
  id: string;
  name: string;
  maxWindSpeedM: number; // in m/s
  maxWindSpeedKn: number; // in knots
  maxWindSpeedKm: number; // in Km/h
  ThermalCam: string; // yes or no
  TeleCam: number; // max zoomlevel in mm
  LaserRangeFinder: number; // max range in mm
  weight: number; // in grams
  MaxTakeOffWeight: number; // in grams
  MaxSpeedM: number; // in m/s
  MaxSpeedKn: number; // in knots
  MaxSpeedKm: number; // in km/h
  MaxAltitude: number; // in meter
  MaxFlightTime: number; // in minutes
  OperatingTempMin: number; // in degrees
  OperatingTempMax: number; // in degrees
  IPrating: string; //IP-rating text
}

export const droneDatabase: Drone[] = [
  { id: '1', 
  name: 'DJI Matrice 4T', 
  maxWindSpeedM: 12, // in m/s
  maxWindSpeedKn: 23.32, // in knots
  maxWindSpeedKm: 43.2, // in Km/h
  ThermalCam: 'yes', // yes or no
  TeleCam: 168, // max zoomlevel in mm
  LaserRangeFinder: 1800, // max range in meter
  weight: 1219, // in grams
  MaxTakeOffWeight: 1420, // in grams
  MaxSpeedM: 21, // in m/s
  MaxSpeedKn: 40.82, // in knots
  MaxSpeedKm: 75.6, // in km/h
  MaxAltitude: 6000, // in meter
  MaxFlightTime: 49, // in minutes
  OperatingTempMin: -20, // in degrees
  OperatingTempMax: 50, // in degrees
  IPrating: 'IP55', //IP-rating text 
  },
  { id: '2', 
  name: 'DJI Matrice 4TD', 
  maxWindSpeedM: 12, // in m/s
  maxWindSpeedKn: 23.32, // in knots
  maxWindSpeedKm: 43.2, // in Km/h
  ThermalCam: 'yes', // yes or no
  TeleCam: 168, // max zoomlevel in mm
  LaserRangeFinder: 1800, // max range in meter
  weight: 1850, // in grams
  MaxTakeOffWeight: 2090, // in grams
  MaxSpeedM: 21, // in m/s
  MaxSpeedKn: 40.82, // in knots
  MaxSpeedKm: 75.6, // in km/h
  MaxAltitude: 6500, // in meter
  MaxFlightTime: 54, // in minutes
  OperatingTempMin: -20, // in degrees
  OperatingTempMax: 50, // in degrees
  IPrating: 'IP55', //IP-rating text
  },
    { id: '3', 
  name: 'DJI Matrice 4TE', 
  maxWindSpeedM: 12, // in m/s
  maxWindSpeedKn: 23.32, // in knots
  maxWindSpeedKm: 43.2, // in Km/h
  ThermalCam: 'yes', // yes or no
  TeleCam: 168, // max zoomlevel in mm
  LaserRangeFinder: 1800, // max range in meter
  weight: 1219, // in grams
  MaxTakeOffWeight: 1420, // in grams
  MaxSpeedM: 21, // in m/s
  MaxSpeedKn: 40.82, // in knots
  MaxSpeedKm: 75.6, // in km/h
  MaxAltitude: 6000, // in meter
  MaxFlightTime: 49, // in minutes
  OperatingTempMin: -20, // in degrees
  OperatingTempMax: 50, // in degrees
  IPrating: 'IP55', //IP-rating text
    }
];