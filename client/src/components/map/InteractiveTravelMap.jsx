import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Compass, MapPin, Hotel, Plane, Utensils, Camera, Navigation, Layers,
  ZoomIn, ZoomOut, AlertCircle, Sun, Cloud, RefreshCw, Eye
} from 'lucide-react';
import { Badge } from '../ui/index';

const CITY_COORDINATES = {
  'Tokyo, Japan': { lat: 35.6762, lng: 139.6503, zoom: 11 },
  'Paris, France': { lat: 48.8566, lng: 2.3522, zoom: 12 },
  'Goa, India': { lat: 15.2993, lng: 74.1240, zoom: 11 },
  'Manali, India': { lat: 32.2432, lng: 77.1892, zoom: 12 },
  'Santorini, Greece': { lat: 36.3932, lng: 25.4615, zoom: 12 },
  'Bali, Indonesia': { lat: -8.4095, lng: 115.1889, zoom: 11 },
  'Default': { lat: 28.6139, lng: 77.2090, zoom: 11 }
};

const MOCK_PLACES = [
  { id: 'p1', name: 'Airport Hub', type: 'airport', latOffset: 0.05, lngOffset: -0.04, desc: 'Flight Departure & Arrival Terminal', icon: '✈️' },
  { id: 'p2', name: 'Luxury Hotel & Resort', type: 'hotel', latOffset: -0.02, lngOffset: 0.02, desc: 'Primary Group Stay & Check-in', icon: '🏨' },
  { id: 'p3', name: 'Main Tourist Attraction', type: 'attraction', latOffset: 0.03, lngOffset: 0.05, desc: 'Historic Site & Photo Spot', icon: '🏛️' },
  { id: 'p4', name: 'Gourmet Restaurant', type: 'restaurant', latOffset: -0.04, lngOffset: -0.02, desc: 'Group Dinner & Local Cuisine', icon: '🍽️' },
];

export default function InteractiveTravelMap({ destination = 'Tokyo, Japan', height = '480px' }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [mapTileStyle, setMapTileStyle] = useState('dark'); // 'dark' | 'street' | 'satellite'
  const [activeMarker, setActiveMarker] = useState(null);
  const [routeDistance, setRouteDistance] = useState('18.4 km');
  const [travelDuration, setTravelDuration] = useState('32 min drive');

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (typeof window === 'undefined' || !window.L) return;

    const L = window.L;

    // Determine center coords
    const cityData = CITY_COORDINATES[destination] || CITY_COORDINATES['Default'];
    const center = [cityData.lat, cityData.lng];

    // Destroy previous instance if exists
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Create Leaflet Map instance
    const map = L.map(mapContainerRef.current, {
      center: center,
      zoom: cityData.zoom,
      zoomControl: false,
    });
    mapInstanceRef.current = map;

    // Tile Layers
    const tileUrls = {
      dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      street: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    };

    const tileLayer = L.tileLayer(tileUrls[mapTileStyle], {
      attribution: '&copy; OpenStreetMap & CartoDB',
      maxZoom: 18,
    }).addTo(map);

    // Marker coordinates array
    const latLngs = [];

    // Add Destination Center Marker
    const mainIcon = L.divIcon({
      className: 'custom-leaflet-marker',
      html: `<div style="background: linear-gradient(135deg, #818CF8, #C084FC); width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; border: 3px solid white; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">📍</div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    const mainMarker = L.marker(center, { icon: mainIcon }).addTo(map);
    mainMarker.bindPopup(`<div style="color: #0f172a; font-family: Inter, sans-serif;"><strong>${destination}</strong><br/>Trip Center Point</div>`);
    latLngs.push(center);

    // Add Places Markers
    MOCK_PLACES.forEach((place) => {
      const pLat = cityData.lat + place.latOffset;
      const pLng = cityData.lng + place.lngOffset;
      latLngs.push([pLat, pLng]);

      const placeIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `<div style="background: rgba(15, 23, 42, 0.9); width: 32px; height: 32px; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: white; font-size: 14px; border: 2px solid rgba(255,255,255,0.8); box-shadow: 0 8px 20px rgba(0,0,0,0.4);">${place.icon}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([pLat, pLng], { icon: placeIcon }).addTo(map);
      marker.bindPopup(`
        <div style="color: #0f172a; font-family: Inter, sans-serif; padding: 4px;">
          <h4 style="margin: 0; font-weight: 800; font-size: 14px;">${place.name}</h4>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #475569;">${place.desc}</p>
        </div>
      `);

      marker.on('click', () => {
        setActiveMarker(place);
      });
    });

    // Draw Real Leaflet Polyline Route
    const polyline = L.polyline(latLngs, {
      color: '#818CF8',
      weight: 4,
      opacity: 0.8,
      dashArray: '8, 6',
      lineCap: 'round',
    }).addTo(map);

    // Fit Map Bounds to show all markers
    try {
      map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
    } catch {}

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [destination, mapTileStyle]);

  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    const cityData = CITY_COORDINATES[destination] || CITY_COORDINATES['Default'];
    mapInstanceRef.current.setView([cityData.lat, cityData.lng], cityData.zoom);
  };

  return (
    <div className="relative rounded-[32px] overflow-hidden bg-slate-900/90 border border-white/20 shadow-2xl flex flex-col text-white" style={{ height }}>
      {/* Top Map Control Header */}
      <div className="p-4 bg-slate-900/80 backdrop-blur-[30px] border-b border-white/15 flex items-center justify-between z-20 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-glow">
            <Compass size={20} className="animate-spin-slow" />
          </div>
          <div>
            <h3 className="font-extrabold text-white text-base tracking-tight">{destination} Live Leaflet Map</h3>
            <p className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest">OpenStreetMap • Live Markers • Polyline Route</p>
          </div>
        </div>

        {/* Map Tile Style Toggles */}
        <div className="flex items-center gap-1.5 bg-white/10 p-1 rounded-full border border-white/20">
          {[
            { id: 'dark', label: 'Dark Mode' },
            { id: 'street', label: 'Street' },
            { id: 'satellite', label: 'Satellite' },
          ].map((style) => (
            <button
              key={style.id}
              onClick={() => setMapTileStyle(style.id)}
              className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all duration-300 ${
                mapTileStyle === style.id
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-glow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {style.label}
            </button>
          ))}
        </div>
      </div>

      {/* Real Leaflet Map Render Container */}
      <div className="relative flex-1 bg-slate-950 w-full h-full">
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Floating Zoom & Recenter Controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-20">
          <button
            onClick={handleRecenter}
            className="w-10 h-10 rounded-full bg-slate-900/90 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white flex items-center justify-center shadow-2xl transition-all"
            title="Recenter Map"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={handleZoomIn}
            className="w-10 h-10 rounded-full bg-slate-900/90 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white flex items-center justify-center shadow-2xl transition-all"
            title="Zoom In"
          >
            <ZoomIn size={18} />
          </button>
          <button
            onClick={handleZoomOut}
            className="w-10 h-10 rounded-full bg-slate-900/90 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white flex items-center justify-center shadow-2xl transition-all"
            title="Zoom Out"
          >
            <ZoomOut size={18} />
          </button>
        </div>

        {/* Route Stats & Place Detail Badge */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-none">
          <div className="bg-slate-900/90 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-2xl shadow-xl flex items-center gap-3">
            <Navigation size={15} className="text-indigo-400" />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Route Distance</p>
              <p className="text-xs font-extrabold text-white">{routeDistance} • {travelDuration}</p>
            </div>
          </div>
        </div>

        {/* Selected Marker Detail Card */}
        {activeMarker && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 left-4 max-w-xs p-4 rounded-[24px] bg-slate-900/95 backdrop-blur-[36px] border border-white/25 shadow-2xl z-20"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{activeMarker.icon}</span>
              <div>
                <Badge variant="primary" className="text-[9px] uppercase">{activeMarker.type}</Badge>
                <h4 className="font-extrabold text-white text-sm mt-0.5">{activeMarker.name}</h4>
                <p className="text-slate-300 text-xs mt-1 leading-tight">{activeMarker.desc}</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
