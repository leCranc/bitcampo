import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ClipboardList, Map as MapIcon, Plus, AlertTriangle, Clock, 
  CheckCircle2, ChevronRight, Minus, Save, TrendingUp,
  MapPin, Trash2, Navigation, Beef, History, Info, 
  Calendar, LayoutDashboard, Sprout, Camera, Droplets, 
  X, FileText, Skull, MoveHorizontal, Wind, Settings, 
  Edit3, Globe, Maximize2, Layers, Map as MapIconLucide, 
  RotateCcw, Eraser, Ruler, Maximize, BarChart3, 
  ChevronDown, ArrowRightLeft, CalendarDays, Target, 
  ArrowRight, Check, Lock, Share2, Copy, MessageCircle, 
  PlusCircle, Thermometer, ExternalLink, Activity, Search,
  CloudOff, LogIn, User
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar 
} from 'recharts';

// --- FIREBASE IMPORTS ---
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, setDoc, onSnapshot, 
  query, addDoc, deleteDoc, updateDoc, increment 
} from 'firebase/firestore';
import { 
  getAuth, signInAnonymously, onAuthStateChanged, 
  signInWithCustomToken, GoogleAuthProvider, signInWithPopup 
} from 'firebase/auth';
import { firebaseConfig } from './firebaseConfig.js';

// --- CONFIGURACIÓN FIREBASE ---
import { firebaseConfig, appId } from './firebaseConfig';

const app = initializeApp(firebaseConfig);
const auth = getAuth
const db = getFirestore(app)gtibit();


// --- CONSTANTES ---
const DEFAULT_CATS = [
  { name: 'Terneros', count: 0 }, { name: 'Terneras', count: 0 },
  { name: 'Novillos', count: 0 }, { name: 'Vaquillonas', count: 0 },
  { name: 'Toros', count: 0 }, { name: 'Vacas', count: 0 }
];

const STATION_SERVICES = [
  { id: 'wunderground', name: 'Wunderground', url: 'https://www.wunderground.com/dashboard/pws/' },
  { id: 'weathercloud', name: 'Weathercloud', url: 'https://app.weathercloud.net/d' },
  { id: 'wow', name: 'WOW (MetOffice)', url: 'https://wow.metoffice.gov.uk/observations/details/' },
  { id: 'ecowitt', name: 'Ecowitt', url: 'https://www.ecowitt.net/home/index?id=' }
];

const WUNDERGROUND_API_KEY = 'e1f10a1e78da46f5b10a1e78da96f525';

// --- UTILIDADES ---
const getDistance = (p1, p2) => {
  const R = 6371000;
  const dLat = (p2.lat - p1.lat) * Math.PI / 180;
  const dLon = (p2.lng - p1.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const getCenter = (coords) => {
  if (!coords || coords.length === 0) return { lat: -31.42, lng: -64.18 };
  const lat = coords.reduce((s, c) => s + parseFloat(c.lat), 0) / coords.length;
  const lng = coords.reduce((s, c) => s + parseFloat(c.lng), 0) / coords.length;
  return { lat, lng };
};

const calculateGeometrics = (coords) => {
  if (!coords || coords.length < 2) return { area: "0.00", perimeter: "0" };
  let perimeter = 0;
  let area = 0;
  const avgLat = coords.reduce((s, c) => s + parseFloat(c.lat), 0) / coords.length;
  const latToMeters = 111320;
  const lngToMeters = 111320 * Math.cos(avgLat * Math.PI / 180);
  
  for (let i = 0; i < coords.length; i++) {
    const p1 = coords[i]; const p2 = coords[(i + 1) % coords.length];
    perimeter += getDistance({lat: parseFloat(p1.lat), lng: parseFloat(p1.lng)}, {lat: parseFloat(p2.lat), lng: parseFloat(p2.lng)});
    area += (parseFloat(p1.lng) * lngToMeters * parseFloat(p2.lat) * latToMeters) - (parseFloat(p2.lng) * lngToMeters * parseFloat(p1.lat) * latToMeters);
  }
  return { area: (Math.abs(area) / 2 / 10000).toFixed(2), perimeter: perimeter.toFixed(0) };
};

const useLeaflet = () => {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (window.L && window.L.map) { setReady(true); return; }
    const check = setInterval(() => { if (window.L && window.L.map) { setReady(true); clearInterval(check); } }, 150);
    const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    const script = document.createElement('script'); script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; script.async = true; script.onload = () => { if (window.L && window.L.map) setReady(true); };
    document.body.appendChild(script);
    return () => clearInterval(check);
  }, []);
  return ready;
};

// --- COMPONENTES UI BASE ---
const Badge = ({ children, color, className = "" }) => (
  <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shadow-sm ${color} ${className}`}>{children}</span>
);

const Card = ({ children, className = "", onClick }) => (
  <div onClick={onClick} className={`bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 ${className} ${onClick ? 'active:scale-[0.98] transition-all cursor-pointer' : ''}`}>{children}</div>
);

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-300 flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest leading-none">{String(title)}</h3>
          <button onClick={onClose} className="p-1.5 bg-slate-100 rounded-full text-slate-500 hover:text-red-500 transition-colors flex items-center justify-center leading-none"><X size={18}/></button>
        </div>
        <div className="p-5 overflow-y-auto bg-slate-50/50 flex-1 pb-24">{children}</div>
      </div>
    </div>
  );
};

const NavBtn = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 min-w-[70px] transition-all duration-300 ${active ? 'scale-105 text-emerald-400' : 'text-slate-400 hover:text-slate-300'}`}>
    <div className={`p-2 rounded-xl transition-all ${active ? 'bg-emerald-400/10 shadow-inner ring-1 ring-emerald-500/20' : ''}`}>{React.cloneElement(icon, { size: 20, strokeWidth: active ? 2.5 : 2 })}</div>
    <span className="text-[9px] font-black uppercase tracking-widest leading-none">{String(label)}</span>
  </button>
);

const MapPolygonPreview = ({ coordinates, className = "", color = "#10b981", simple = false, markers = [] }) => {
  if (!coordinates || coordinates.length === 0) return <div className={`bg-slate-50 rounded-xl flex flex-col items-center justify-center text-slate-300 italic text-[10px] gap-2 ${className}`}><MapIcon size={16} />Sin datos</div>;
  const parsed = coordinates.map(c => ({ lat: parseFloat(c.lat), lng: parseFloat(c.lng) }));
  const lats = parsed.map(c => c.lat); const lngs = parsed.map(c => c.lng);
  markers.forEach(m => { if (m.lat && m.lng) { lats.push(parseFloat(m.lat)); lngs.push(parseFloat(m.lng)); } });
  
  const minLat = Math.min(...lats); const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs); const maxLng = Math.max(...lngs);
  const cosLat = Math.cos(((minLat + maxLat) / 2) * Math.PI / 180);
  const latRange = maxLat - minLat; const lngRange = (maxLng - minLng) * cosLat;
  const maxRange = Math.max(latRange, lngRange) || 0.0001;
  const size = 100; const pad = simple ? 8 : 20; const tS = size - 2 * pad;
  const scaleLng = (v) => pad + (tS - (lngRange / maxRange) * tS) / 2 + ((v - minLng) * cosLat / maxRange) * tS;
  const scaleLat = (v) => size - (pad + (tS - (latRange / maxRange) * tS) / 2 + ((v - minLat) / maxRange) * tS);
  const points = parsed.slice(0, coordinates.length).map(c => `${scaleLng(c.lng)},${scaleLat(c.lat)}`).join(' ');
  
  return (
    <div className={`bg-slate-900 rounded-xl overflow-hidden relative shadow-inner ${className}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full p-1">
        {parsed.length >= 3 && <polygon points={points} fill={`${color}22`} stroke={color} strokeWidth={simple ? "3" : "1.5"} strokeLinejoin="round" />}
        {markers.map((m, i) => (
          <g key={i}>
            <circle cx={scaleLng(m.lng)} cy={scaleLat(m.lat)} r="3" fill="#3b82f6" stroke="white" strokeWidth="0.8" />
            <text x={scaleLng(m.lng)} y={scaleLat(m.lat) - 5} fontSize="4" fill="white" fontWeight="bold" textAnchor="middle">{String(m.label)}</text>
          </g>
        ))}
        {parsed.slice(0, coordinates.length).map((c, i) => <circle key={i} cx={scaleLng(c.lng)} cy={scaleLat(c.lat)} r={simple ? "2.5" : "1.8"} fill={color} stroke="white" strokeWidth="0.5" />)}
      </svg>
    </div>
  );
};

const InteractiveMapPicker = ({ bounds, setBounds, parentBounds = null, className = "", markers = [], mode = "polygon", onMarkerClick = null }) => {
  const isReady = useLeaflet();
  const mapRef = useRef(null);
  const leafletInstance = useRef(null);
  const markersRef = useRef([]);
  const polygonRef = useRef(null);

  useEffect(() => {
    if (!isReady || !mapRef.current || leafletInstance.current) return;
    try {
      let center = [-31.42, -64.18]; let zoom = 14;
      if (parentBounds?.length > 0) { center = [parseFloat(parentBounds[0].lat), parseFloat(parentBounds[0].lng)]; zoom = 16; }
      if (markers?.length > 0 && mode === 'point') { center = [parseFloat(markers[0].lat), parseFloat(markers[0].lng)]; zoom = 15; }
      
      leafletInstance.current = window.L.map(mapRef.current, { zoomControl: false, attributionControl: false }).setView(center, zoom);
      window.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19 }).addTo(leafletInstance.current);
      
      leafletInstance.current.on('click', (e) => { 
        const { lat, lng } = e.latlng; 
        setBounds(curr => mode === 'point' ? [{ lat: lat.toFixed(6), lng: lng.toFixed(6) }] : [...curr, { lat: lat.toFixed(6), lng: lng.toFixed(6) }]); 
      });
    } catch (e) {}
    return () => { if (leafletInstance.current) { leafletInstance.current.remove(); leafletInstance.current = null; } };
  }, [isReady, parentBounds, mode]);

  useEffect(() => {
    if (!leafletInstance.current || !window.L) return;
    markersRef.current.forEach(m => m.remove()); markersRef.current = [];
    if (polygonRef.current) polygonRef.current.remove();
    
    const latLngs = bounds.map(b => [parseFloat(b.lat), parseFloat(b.lng)]);
    if (mode === 'polygon') {
      if (latLngs.length >= 3) polygonRef.current = window.L.polygon(latLngs, { color: '#10b981', weight: 3, fillOpacity: 0.35 }).addTo(leafletInstance.current);
      else if (latLngs.length === 2) polygonRef.current = window.L.polyline(latLngs, { color: '#10b981', weight: 3 }).addTo(leafletInstance.current);
    }
    
    latLngs.forEach((pos) => {
      const marker = window.L.circleMarker(pos, { radius: 7, fillColor: mode === 'point' ? "#3b82f6" : "#10b981", color: "#fff", weight: 2, fillOpacity: 1 }).addTo(leafletInstance.current);
      markersRef.current.push(marker);
    });

    markers.forEach(m => {
      const marker = window.L.circleMarker([m.lat, m.lng], { radius: 8, fillColor: "#fbbf24", color: "#fff", weight: 2, fillOpacity: 1 }).addTo(leafletInstance.current);
      marker.bindTooltip(String(m.label), { permanent: true, direction: 'top' });
      marker.on('click', (e) => { window.L.DomEvent.stopPropagation(e); if (onMarkerClick) onMarkerClick(m); });
      markersRef.current.push(marker);
    });

    if (parentBounds?.length >= 3) {
      const parentLngs = parentBounds.map(p => [parseFloat(p.lat), parseFloat(p.lng)]);
      window.L.polygon(parentLngs, { color: '#ffffff', weight: 2, fillOpacity: 0.05, dashArray: '5, 10' }).addTo(leafletInstance.current);
      if (mode === 'point' && markers.length > 0) leafletInstance.current.setView([markers[0].lat, markers[0].lng], 14);
    }
  }, [bounds, markers, mode, parentBounds, onMarkerClick]);

  return (
    <div className={`relative bg-slate-900 rounded-xl overflow-hidden shadow-md border-2 border-white ${className}`}>
      <div ref={mapRef} className="w-full h-full"></div>
      <div className="absolute top-3 right-3 z-[400] flex flex-col gap-2">
        {mode === 'polygon' && <button onClick={(e) => { e.stopPropagation(); setBounds(c => c.slice(0, -1)); }} className="bg-white p-2.5 rounded-lg shadow-md active:scale-95 flex items-center justify-center leading-none"><RotateCcw size={16} /></button>}
        <button onClick={(e) => { e.stopPropagation(); setBounds([]); }} className="bg-red-500 text-white p-2.5 rounded-lg shadow-md active:scale-95 flex items-center justify-center leading-none"><Eraser size={16} /></button>
      </div>
    </div>
  );
};

// --- COMPONENTE DASHBOARD DE CLIMA ---
function WeatherDashboard({ station, fetcher }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (station.service === 'wunderground') {
        const result = await fetcher(station.stationId);
        setData(result);
      }
      setLoading(false);
    };
    loadData();
  }, [station.stationId, station.service, fetcher]);

  if (loading) return <div className="mx-1 my-3 p-6 bg-white rounded-xl border border-slate-200 flex justify-center"><Activity className="animate-spin text-slate-300"/></div>;
  if (!data) return (
    <div className="mx-1 my-3 p-5 bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center text-center gap-3">
       <CloudOff size={24} className="text-slate-300" />
       <div>
         <p className="text-sm font-black text-slate-700">Sin conexión a la estación</p>
         <p className="text-[10px] font-bold text-slate-400 mt-1 max-w-[200px]">No se pudo obtener información en tiempo real. Revisa el ID o intenta más tarde.</p>
       </div>
       <button onClick={() => window.open(`https://www.wunderground.com/dashboard/pws/${station.stationId}`, '_blank')} className="mt-2 bg-slate-50 py-2 px-4 rounded-lg text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors"><ExternalLink size={14}/> Ver en Wunderground</button>
    </div>
  );

  const { metric, humidity, winddir, uv } = data;
  const getWindDirection = (deg) => {
    const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    return dirs[Math.round(deg / 22.5) % 16];
  };

  return (
    <div className="mx-1 my-3 bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200 font-sans">
      <div className="p-4 pb-2">
        <h2 className="text-lg text-slate-800 font-light border-b-2 border-slate-800 pb-1 mb-2 inline-block">Station Summary</h2>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
          <p className="text-[11px] font-bold text-slate-800">Online <span className="text-slate-400">(updated just now)</span></p>
        </div>
      </div>
      <div className="bg-slate-50 px-4 py-2 border-y border-slate-100"><p className="text-slate-500 text-xs font-bold tracking-wide">CURRENT CONDITIONS</p></div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-light text-red-600 leading-none">{metric?.temp?.toFixed(1) || '--'}</span>
              <span className="text-lg text-slate-600 font-light">°C</span>
            </div>
            <p className="text-slate-400 text-sm mt-1 font-medium">Feels Like {metric?.heatIndex?.toFixed(1) || '--'} °</p>
          </div>
          <div className="relative w-16 h-16 rounded-full border-4 border-dashed border-slate-200 flex items-center justify-center shrink-0 mx-2">
            <span className="font-bold text-slate-800 text-sm">{getWindDirection(winddir || 0)}</span>
            <div className="absolute inset-0" style={{ transform: `rotate(${winddir || 0}deg)` }}>
              <div className="absolute top-[-2px] left-1/2 -ml-[5px] w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[8px] border-b-slate-700"></div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-slate-400 text-[9px] font-bold tracking-widest mb-1 uppercase">WIND & GUST</p>
            <p className="text-slate-800 font-black text-sm">{metric?.windSpeed?.toFixed(1) || '--'} <span className="text-slate-300 font-normal">/</span> {metric?.windGust?.toFixed(1) || '--'} <span className="font-normal text-slate-400 text-xs">km/h</span></p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-y-4 gap-x-2">
          <div><p className="text-slate-400 text-[9px] font-bold tracking-widest mb-0.5 uppercase">DEWPOINT</p><p className="font-black text-slate-800 text-sm">{metric?.dewpt?.toFixed(1) || '--'} <span className="font-normal text-[10px]">° C</span></p></div>
          <div><p className="text-slate-400 text-[9px] font-bold tracking-widest mb-0.5 uppercase">PRECIP RATE</p><p className="font-black text-slate-800 text-sm">{metric?.precipRate?.toFixed(2) || '0.00'} <span className="font-normal text-[10px]">mm/hr</span></p></div>
          <div><p className="text-slate-400 text-[9px] font-bold tracking-widest mb-0.5 uppercase">PRESSURE</p><p className="font-black text-slate-800 text-sm">{metric?.pressure?.toFixed(2) || '--'} <span className="font-normal text-[10px]">hPa</span></p></div>
          <div><p className="text-slate-400 text-[9px] font-bold tracking-widest mb-0.5 uppercase">HUMIDITY</p><p className="font-black text-slate-800 text-sm">{humidity || '--'} <span className="font-normal text-[10px]">%</span></p></div>
          <div><p className="text-slate-400 text-[9px] font-bold tracking-widest mb-0.5 uppercase">PRECIP ACCUM</p><p className="font-black text-slate-800 text-sm">{metric?.precipTotal?.toFixed(2) || '0.00'} <span className="font-normal text-[10px]">mm</span></p></div>
          <div><p className="text-slate-400 text-[9px] font-bold tracking-widest mb-0.5 uppercase">UV</p><p className="font-black text-slate-800 text-sm">{uv || '0'}</p></div>
        </div>
      </div>
      <button onClick={() => window.open(`https://www.wunderground.com/dashboard/pws/${station.stationId}`, '_blank')} className="w-full bg-slate-50 border-t border-slate-100 py-3 text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors"><ExternalLink size={14}/> Abrir en Wunderground</button>
    </div>
  );
}

// --- SECCIONES PRINCIPALES ---

function TareasSection({ tareas, lotes, userId }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', urgency: 'habitual', loteId: '' });
  const handleSave = async () => {
    if (!form.title) return;
    await addDoc(collection(db, 'artifacts', appId, 'users', userId, 'tareas'), { ...form, metadata: { createdAt: Date.now() }, status: 'pending' });
    setForm({ title: '', urgency: 'habitual', loteId: '' }); setShowAdd(false);
  };
  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-32 px-1 pt-2 leading-none">
      <header className="flex justify-between items-end px-2 pt-2 leading-none mb-4">
        <div className="leading-none"><h2 className="text-2xl font-black text-slate-800 tracking-tight italic uppercase">Tareas</h2><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Gestión Activa</p></div>
        <button onClick={() => setShowAdd(true)} className="bg-emerald-600 text-white p-3 rounded-xl shadow-md active:scale-95 flex items-center justify-center leading-none"><Plus size={20}/></button>
      </header>
      <div className="space-y-3 px-1 leading-none">
        {tareas.sort((a,b)=> (b.metadata?.createdAt || 0) - (a.metadata?.createdAt || 0)).map(t => (
          <Card key={t.id} className={`border-l-[8px] bg-white ${t.urgency === 'emergencia' ? 'border-l-red-600' : 'border-l-emerald-500'} leading-none`}>
            <div className="flex justify-between items-center leading-none">
               <div className="space-y-2 flex-1 pr-4 leading-none">
                  <Badge color={t.urgency === 'emergencia' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-500'}>{String(t.urgency)}</Badge>
                  <h4 className="text-sm font-black text-slate-800 uppercase leading-tight">{String(t.title)}</h4>
                  <div className="flex gap-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-t border-slate-50 pt-2 w-fit">
                     <span className="flex items-center gap-1"><MapPin size={10} className="text-emerald-500"/> {String(lotes.find(l=>l.id===t.loteId)?.nombre || 'Sector Gral')}</span>
                     <span className="flex items-center gap-1"><Calendar size={10}/> {new Date(t.metadata?.createdAt).toLocaleDateString()}</span>
                  </div>
               </div>
               <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'users', userId, 'tareas', t.id))} className="bg-emerald-50 text-emerald-600 p-3 rounded-xl active:scale-90"><CheckCircle2 size={24}/></button>
            </div>
          </Card>
        ))}
      </div>
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Nueva Tarea">
        <div className="space-y-4 pb-2 px-1 leading-none">
          <input className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 font-bold text-sm outline-none" placeholder="Descripción..." value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
          <div className="grid grid-cols-2 gap-3">
            <select className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs outline-none" value={form.urgency} onChange={e => setForm({...form, urgency: e.target.value})}><option value="habitual">Habitual</option><option value="emergencia">Emergencia</option></select>
            <select className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs outline-none" value={form.loteId} onChange={e => setForm({...form, loteId: e.target.value})}><option value="">Cualquier Lote</option>{lotes.map(l => <option key={l.id} value={l.id}>{String(l.nombre)}</option>)}</select>
          </div>
          <button onClick={handleSave} className="w-full bg-emerald-900 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-md active:scale-95 mt-2">Confirmar</button>
        </div>
      </Modal>
    </div>
  );
}

function MangaSection({ hacienda, lotes, movementContext, setMovementContext, setActiveTab, userId }) {
  const [view, setView] = useState('list');
  const [current, setCurrent] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [transferDest, setTransferDest] = useState('');
  const [transferCounts, setTransferCounts] = useState([]);
  const [newMangaForm, setNewMangaForm] = useState({ name: '', type: 'conteo', lotId: '' });
  const [batchCounts, setBatchCounts] = useState(DEFAULT_CATS.map(c => ({...c})));
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [finishedActaData, setFinishedActaData] = useState(null);

  useEffect(() => {
    if (movementContext) {
      setView('transfer');
      const sourceCats = (movementContext.from.categories || DEFAULT_CATS).filter(c => (parseInt(c.count) || 0) > 0);
      setTransferCounts(sourceCats.map(c => ({ name: c.name, count: 0, maxAvailable: parseInt(c.count) || 0 })));
    } else { setView('list'); }
  }, [movementContext]);

  const openNewCountModal = () => {
    const now = new Date();
    const autoName = `[${now.toISOString().split('T')[0]}][${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}]`;
    setNewMangaForm({ name: autoName, type: 'conteo', lotId: '' });
    setShowAdd(true);
  };

  const getSummaryText = (session) => {
    if (!session || !session.categories) return "";
    const detailText = session.categories.filter(c => (parseInt(c.count) || 0) > 0).map(c => `${c.count} ${c.name}`).join(', ');
    const lotName = lotes.find(l => l.id === session.loteId)?.nombre || 'General';
    return `ACTA MANGA: ${session.nombre}\nLote: ${lotName}\nTotal Auditado: ${session.total} cab.\nDesglose: ${detailText || 'Sin datos'}`;
  };

  const handleStart = async (nombre, tipo, loteId) => {
    const session = { nombre, tipo, loteId, categories: DEFAULT_CATS.map(c => ({...c})), pasadas: [], audit: { created: Date.now(), modified: Date.now() }, total: 0, status: 'active' };
    const ref = await addDoc(collection(db, 'artifacts', appId, 'users', userId, 'hacienda'), session);
    setCurrent({ id: ref.id, ...session }); setView('detail'); setShowAdd(false);
  };

  const updateCategoryInFirestore = async (index, field, value) => {
    const updatedCats = [...current.categories];
    updatedCats[index][field] = field === 'count' ? parseInt(value) || 0 : value;
    const newTotal = updatedCats.reduce((s, c) => s + (parseInt(c.count) || 0), 0);
    setCurrent({ ...current, categories: updatedCats, total: newTotal });
    await updateDoc(doc(db, 'artifacts', appId, 'users', userId, 'hacienda', current.id), { categories: updatedCats, total: newTotal, "audit.modified": Date.now() });
  };

  const addNewCategory = async () => {
    const newCat = { name: 'Nueva Categoría', count: 0 };
    const updatedCats = [...current.categories, newCat];
    const newBatch = [...batchCounts, { name: 'Nueva Categoría', count: 0 }];
    setCurrent({...current, categories: updatedCats}); setBatchCounts(newBatch);
    await updateDoc(doc(db, 'artifacts', appId, 'users', userId, 'hacienda', current.id), { categories: updatedCats, "audit.modified": Date.now() });
  };

  const handleRegisterPasada = async () => {
    const batchTotal = batchCounts.reduce((s, c) => s + (parseInt(c.count) || 0), 0);
    if (batchTotal === 0) return;
    const updatedCategories = current.categories.map((cat, i) => ({ ...cat, count: (parseInt(cat.count) || 0) + (batchCounts[i]?.count || 0) }));
    const newSessionTotal = updatedCategories.reduce((s, c) => s + c.count, 0);
    const newPasada = { num: (current.pasadas?.length || 0) + 1, totalBatch: batchTotal, timestamp: Date.now() };
    const update = { ...current, categories: updatedCategories, pasadas: [...(current.pasadas || []), newPasada], total: newSessionTotal, "audit.modified": Date.now() };
    setCurrent(update);
    await updateDoc(doc(db, 'artifacts', appId, 'users', userId, 'hacienda', current.id), { categories: updatedCategories, pasadas: [...(current.pasadas || []), newPasada], total: newSessionTotal, "audit.modified": Date.now() });
    setBatchCounts(current.categories.map(c => ({ name: c.name, count: 0 })));
  };

  const finalizeActa = async (updateLote = true) => {
    const summary = getSummaryText(current);
    await updateDoc(doc(db, 'artifacts', appId, 'users', userId, 'hacienda', current.id), { status: 'finished' });
    await addDoc(collection(db, 'artifacts', appId, 'users', userId, 'registros'), { tipo: 'auditoria', loteId: current.loteId || '', desc: `ACTA CERRADA: ${current.nombre}. Total auditado: ${current.total} cabezas.`, metadata: { timestamp: Date.now() } });
    if (updateLote && current.loteId) { 
      await updateDoc(doc(db, 'artifacts', appId, 'users', userId, 'lotes', current.loteId), { hacienda: current.total, categories: current.categories }); 
    }
    setFinishedActaData({ summary, total: current.total }); setShowFinishConfirm(false);
  };

  const executeTransfer = async () => {
    if (!transferDest) return;
    const totalToMove = transferCounts.reduce((s, c) => s + (parseInt(c.count) || 0), 0);
    if (totalToMove === 0) return;
    const fromLot = lotes.find(l => l.id === movementContext.from.id);
    const toLot = lotes.find(l => l.id === transferDest);
    
    const updatedFromCats = (fromLot.categories || []).map(cat => {
      const moved = transferCounts.find(tc => tc.name === cat.name)?.count || 0;
      return { ...cat, count: Math.max(0, (parseInt(cat.count) || 0) - moved) };
    });
    const fromTotal = updatedFromCats.reduce((s, c) => s + c.count, 0);
    
    const updatedToCats = [...(toLot.categories || [])];
    transferCounts.forEach(tCat => {
      if (tCat.count > 0) {
        const idx = updatedToCats.findIndex(c => c.name === tCat.name);
        if (idx > -1) { updatedToCats[idx].count = (parseInt(updatedToCats[idx].count) || 0) + tCat.count; } 
        else { updatedToCats.push({ name: tCat.name, count: tCat.count }); }
      }
    });
    const toTotal = updatedToCats.reduce((s, c) => s + (parseInt(c.count) || 0), 0);
    
    await updateDoc(doc(db, 'artifacts', appId, 'users', userId, 'lotes', fromLot.id), { hacienda: fromTotal, categories: updatedFromCats });
    await updateDoc(doc(db, 'artifacts', appId, 'users', userId, 'lotes', toLot.id), { hacienda: toTotal, categories: updatedToCats });
    await addDoc(collection(db, 'artifacts', appId, 'users', userId, 'registros'), { tipo: 'movimiento', loteId: fromLot.id, desc: `TRASLADO: ${totalToMove} cabezas hacia ${toLot.nombre}`, metadata: { timestamp: Date.now() } });
    setMovementContext(null); setActiveTab('campos');
  };

  if (view === 'transfer') return (
    <div className="space-y-4 animate-in slide-in-from-right-10 duration-500 pb-32 px-1 pt-2 leading-none">
      <header className="flex justify-between items-center px-2 leading-none"><button onClick={() => { setMovementContext(null); setView('list'); }} className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 active:scale-95 leading-none"><ChevronRight className="rotate-180" size={14}/> Cancelar</button><Badge color="bg-blue-600 text-white">Traslado Directo</Badge></header>
      <Card className="bg-slate-900 text-white border-none space-y-3 shadow-md leading-none">
         <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Destino: {transferDest ? String(lotes.find(l=>l.id===transferDest)?.nombre) : 'Seleccionar...'}</p>
         <select className="w-full p-3 rounded-xl bg-white/10 border border-white/10 font-bold text-sm text-white outline-none appearance-none" value={transferDest} onChange={(e) => setTransferDest(e.target.value)}><option value="" className="text-slate-800">Seleccionar Destino...</option>{lotes.filter(l => l.id !== movementContext.from.id).map(l => <option key={l.id} value={l.id} className="text-slate-800">{String(l.nombre)}</option>)}</select>
      </Card>
      <div className="space-y-2 pt-2 leading-none">
         {transferCounts.map((cat, i) => (
           <div key={i} className="bg-white p-4 rounded-xl flex items-center justify-between shadow-sm border border-slate-200 group"><div className="flex-1 space-y-1 leading-none"><p className="font-black text-slate-700 uppercase text-[11px] leading-none">{String(cat.name)}</p><p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Disp: {String(cat.maxAvailable)}</p></div><div className="flex items-center gap-3"><button onClick={() => setTransferCounts(curr => curr.map((c, idx) => idx === i ? {...c, count: Math.max(0, c.count - 1)} : c))} className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center leading-none active:bg-slate-200"><Minus size={14}/></button><span className="w-8 text-center font-black text-emerald-700 text-lg">{String(cat.count)}</span><button onClick={() => setTransferCounts(curr => curr.map((c, idx) => idx === i ? {...c, count: Math.min(cat.maxAvailable, c.count + 1)} : c))} className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center leading-none active:bg-emerald-100"><Plus size={14}/></button></div></div>
         ))}
      </div>
      <button onClick={executeTransfer} disabled={!transferDest || transferCounts.reduce((s,c)=>s+c.count, 0) === 0} className="w-full bg-emerald-900 text-white py-5 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-md active:scale-95 disabled:opacity-30 mt-4">Confirmar Movimiento</button>
    </div>
  );

  if (finishedActaData) return (
    <div className="space-y-6 animate-in zoom-in-95 duration-500 px-4 pt-10 text-center pb-32 leading-none">
       <div className="bg-emerald-50 p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto text-emerald-600 shadow-sm border border-emerald-100 leading-none"><Check size={36} strokeWidth={3} /></div>
       <div className="space-y-2 text-center leading-none"><h2 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-none">Acta Cerrada</h2><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed leading-none">Inventario auditado con éxito.</p></div>
       <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-left font-mono text-[9px] leading-relaxed text-slate-600 whitespace-pre-wrap leading-none">{String(finishedActaData.summary)}</div>
       <div className="grid grid-cols-2 gap-3 leading-none">
          <button onClick={() => { const t = document.createElement('textarea'); t.value = finishedActaData.summary; document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t); }} className="bg-slate-900 text-white py-4 rounded-xl font-black text-[9px] uppercase flex items-center justify-center gap-2 shadow-md active:scale-95 leading-none"><Copy size={14}/> Copiar</button>
          <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(finishedActaData.summary)}`, '_blank')} className="bg-emerald-500 text-white py-4 rounded-xl font-black text-[9px] uppercase flex items-center justify-center gap-2 shadow-md active:scale-95 leading-none"><MessageCircle size={14}/> WhatsApp</button>
       </div>
       <button onClick={() => { setFinishedActaData(null); setView('list'); setCurrent(null); }} className="w-full py-3 text-slate-400 font-black text-[10px] uppercase tracking-widest border border-slate-200 rounded-xl active:bg-slate-50 transition-all leading-none mt-2">Cerrar Visor</button>
    </div>
  );

  if (view === 'detail') {
    const totalInBatch = batchCounts.reduce((s, c) => s + (parseInt(c.count) || 0), 0);
    const isFinished = current.status === 'finished';
    const displayCategories = isFinished ? current.categories : batchCounts;

    return (
      <div className="space-y-5 animate-in slide-in-from-right-10 duration-500 pb-32 px-1 pt-2 leading-none">
        <header className="flex justify-between items-center px-2 leading-none mb-2"><button onClick={() => setView('list')} className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 transition-all active:scale-95 leading-none"><ChevronRight className="rotate-180" size={14}/> Volver</button><div className="text-right leading-none"><Badge color={isFinished ? "bg-slate-500 text-white" : "bg-emerald-100 text-emerald-800"}>{isFinished ? "ACTA CERRADA" : "EN CONTEO"}</Badge><h3 className="text-[10px] font-black text-slate-800 uppercase mt-1 tracking-widest leading-none leading-none">{String(current.nombre)}</h3></div></header>
        {!isFinished ? (
           <button onClick={handleRegisterPasada} disabled={totalInBatch === 0} className="w-full bg-emerald-600 text-white p-6 rounded-2xl shadow-md border-b-4 border-emerald-700 active:scale-95 active:border-b-2 transition-all disabled:opacity-50 disabled:border-b-0 flex flex-col items-center justify-center gap-1 leading-none">
              <p className="text-[9px] font-black opacity-70 uppercase mb-1 tracking-widest leading-none">PASADA #{(current.pasadas?.length || 0) + 1}</p>
              <p className="text-4xl font-black leading-none leading-none">{String(totalInBatch)}</p>
              <p className="text-[10px] font-black uppercase tracking-widest mt-1 leading-none">REGISTRAR EN ACTA</p>
           </button>
        ) : (
           <div className="bg-slate-900 text-white p-6 rounded-2xl text-center shadow-md relative overflow-hidden leading-none"><div className="absolute top-0 right-0 p-4 opacity-10 leading-none"><Lock size={48}/></div><p className="text-[9px] font-black opacity-50 uppercase mb-1 tracking-widest leading-none">Total Auditado</p><p className="text-4xl font-black leading-none leading-none">{String(current.total)}</p><div className="flex gap-2 justify-center mt-3 leading-none"><Badge color="bg-emerald-500 text-white shadow-sm">Registro Permanente</Badge><button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(getSummaryText(current))}`, '_blank')} className="bg-white/10 p-1.5 rounded-lg border border-white/10 active:bg-white/20 transition-all flex items-center justify-center leading-none leading-none"><Share2 size={14}/></button></div></div>
        )}
        <div className="space-y-2 pt-2 leading-none">
           <div className="flex justify-between items-center px-3 mb-1 leading-none"><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Categoría / Total Acum.</span>{!isFinished && <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest leading-none">En Manga</span>}</div>
           {displayCategories.map((displayCat, i) => {
             const accumulated = isFinished ? displayCat.count : (current.categories[i]?.count || 0);
             const catName = isFinished ? displayCat.name : (current.categories[i]?.name || '');
             if (isFinished && (parseInt(accumulated) || 0) === 0) return null;
             return (
               <div key={i} className="bg-white p-4 rounded-xl flex items-center justify-between shadow-sm border border-slate-200 group leading-none"><div className="flex-1 space-y-1 leading-none">{!isFinished ? (<input className="font-black text-slate-800 uppercase text-[11px] w-full bg-transparent border-none outline-none focus:text-emerald-600 leading-none" value={catName} onChange={(e) => updateCategoryInFirestore(i, 'name', e.target.value)} placeholder="Nombre..." />) : (<p className="font-black text-slate-800 uppercase text-[11px] leading-none mb-1 leading-none">{String(catName)}</p>)}<div className="flex items-center gap-1.5 leading-none"><span className="text-[9px] font-black text-slate-400 uppercase leading-none">Total:</span>{!isFinished ? (<input type="number" className="text-[10px] font-black text-slate-900 w-12 bg-slate-50 rounded px-1 border border-slate-100 outline-none leading-none" value={accumulated} onChange={(e) => updateCategoryInFirestore(i, 'count', e.target.value)} />) : (<span className="text-[10px] font-black text-slate-900 leading-none">{String(accumulated)}</span>)}</div></div>
                  {!isFinished && (<div className="flex items-center gap-3 leading-none"><button onClick={() => setBatchCounts(curr => curr.map((c, idx) => idx === i ? {...c, count: Math.max(0, c.count - 1)} : c))} className="w-9 h-9 bg-slate-50 rounded-lg text-slate-400 flex items-center justify-center active:bg-slate-200 border border-slate-100 leading-none leading-none"><Minus size={14}/></button><span className="w-8 text-center font-black text-emerald-700 text-xl leading-none leading-none">{String(displayCat.count)}</span><button onClick={() => setBatchCounts(curr => curr.map((c, idx) => idx === i ? {...c, count: c.count + 1} : c))} className="w-9 h-9 bg-emerald-50 rounded-lg text-emerald-700 flex items-center justify-center active:bg-emerald-100 border border-emerald-100 leading-none leading-none"><Plus size={14}/></button></div>)}
               </div>
             );
           })}
           {!isFinished && <button onClick={addNewCategory} className="w-full py-3 border border-dashed border-slate-300 rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2 active:bg-slate-50 transition-colors mb-4 leading-none leading-none"><PlusCircle size={14}/> Añadir Categoría Personalizada</button>}
        </div>
        {!isFinished && <button onClick={() => setShowFinishConfirm(true)} className="w-full bg-emerald-900 text-white py-5 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-md mt-4 active:scale-95 transition-all leading-none leading-none">Finalizar Acta (Total: {String(current.total)})</button>}
        <Modal isOpen={showFinishConfirm} onClose={() => setShowFinishConfirm(false)} title="Confirmar Auditoría">
           <div className="space-y-5 pb-4 pt-1 text-center leading-none"><div className="bg-amber-50 p-5 rounded-xl border border-amber-200 text-amber-900 space-y-2 leading-none"><div className="flex items-center justify-center gap-2 font-black text-[11px] uppercase leading-none leading-none leading-none"><AlertTriangle size={16}/> Cierre de Acta</div><p className="text-[11px] leading-relaxed font-medium italic leading-none">¿Desea que este conteo de {String(current.total)} animales actualice el stock oficial del lote?</p></div><div className="space-y-2 leading-none"><button onClick={() => finalizeActa(true)} className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black text-[10px] uppercase shadow-sm active:scale-95 transition-all leading-none leading-none">Finalizar e Impactar Lote</button><button onClick={() => finalizeActa(false)} className="w-full bg-slate-800 text-white py-4 rounded-xl font-black text-[10px] uppercase shadow-sm active:scale-95 transition-all leading-none leading-none">Solo Generar Acta (Registro)</button><button onClick={() => setShowFinishConfirm(false)} className="w-full py-3 text-slate-500 font-bold text-[9px] uppercase active:bg-slate-50 rounded-xl leading-none leading-none">Seguir Contando</button></div></div>
        </Modal>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-32 px-1 pt-2 leading-none">
      <header className="flex justify-between items-end px-2 pt-2 leading-none mb-4"><div><h2 className="text-2xl font-black text-slate-800 tracking-tight italic uppercase">Hacienda</h2><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Registro Manga</p></div><button onClick={openNewCountModal} className="bg-emerald-600 text-white p-3 rounded-xl shadow-md active:scale-90 flex items-center justify-center leading-none"><Plus size={20}/></button></header>
      <div className="space-y-3 px-1 leading-none">
        {hacienda.sort((a,b)=> (b.audit?.modified || 0) - (a.audit?.modified || 0)).map(s => (
          <Card key={s.id} onClick={() => { setCurrent(s); setView('detail'); }} className={`flex justify-between items-center group cursor-pointer border-l-4 transition-all p-4 bg-white shadow-sm ${s.status === 'finished' ? 'border-l-slate-300 opacity-80' : 'border-l-emerald-500'}`}><div className="flex items-center gap-4 leading-none"><div className={`p-3 rounded-xl shadow-sm ${s.status === 'finished' ? 'bg-slate-50 text-slate-400 border border-slate-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'} flex items-center justify-center`}><Beef size={24} /></div><div className="space-y-1.5"><h4 className="text-sm font-black text-slate-800 uppercase leading-none truncate w-32">{String(s.nombre)}</h4><div className="flex gap-2"><Badge color="bg-slate-50 text-slate-500 border border-slate-200">{String(s.tipo)}</Badge>{s.status === 'finished' && <Badge color="bg-slate-800 text-white">CERRADA</Badge>}</div></div></div><div className="text-right pr-2 leading-none"><p className="text-2xl font-black text-slate-900 leading-none">{String(s.total)}</p><p className="text-[7px] font-black text-slate-400 uppercase mt-1 opacity-80">Cabezas</p></div></Card>
        ))}
      </div>
    </div>
  );
}

function CamposSection({ campos, lotes, pluvios, registros, estaciones = [], setActiveTab, setMovementContext, userId }) {
  const [view, setView] = useState('list');
  const [selectedCampo, setSelectedCampo] = useState(null);
  const [viewingLote, setViewingLote] = useState(null);
  const [showAddCampo, setShowAddCampo] = useState(false);
  const [showAddLote, setShowAddLote] = useState(false);
  const [showAddRain, setShowAddRain] = useState(false);
  const [showAddStation, setShowAddStation] = useState(false);
  const [refDate, setRefDate] = useState(new Date().toISOString().split('T')[0]);
  const [expandStock, setExpandStock] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedStations, setScannedStations] = useState([]);
  
  const [geoForm, setGeoForm] = useState({ name: '', bounds: [] });
  const [rainForm, setRainForm] = useState({ mm: '', date: new Date().toISOString().split('T')[0] });
  const [stationForm, setStationForm] = useState({ name: '', service: 'wunderground', stationId: '', bounds: [] });
  const [loteToDelete, setLoteToDelete] = useState(null);

  const center = useMemo(() => getCenter(selectedCampo?.boundaries), [selectedCampo]);

  const scanNearbyStations = () => {
    setIsScanning(true);
    setTimeout(() => {
      const mock = [
        { label: 'KCORDOBA42', lat: center.lat + 0.004, lng: center.lng + 0.002, id: 'KCORDOBA42', isScanned: true },
        { label: 'EST_NORTE_X', lat: center.lat - 0.006, lng: center.lng - 0.004, id: 'EST_NORTE_X', isScanned: true },
        { label: 'S_AGRO_PREC', lat: center.lat + 0.010, lng: center.lng - 0.005, id: 'S_AGRO_PREC', isScanned: true }
      ];
      setScannedStations(mock); setIsScanning(false);
    }, 1500);
  };

  const handleSaveCampo = async () => {
    const { area, perimeter } = calculateGeometrics(geoForm.bounds);
    await addDoc(collection(db, 'artifacts', appId, 'users', userId, 'campos'), { nombre: geoForm.name, boundaries: geoForm.bounds, area, perimeter, createdAt: Date.now() });
    setGeoForm({ name: '', bounds: [] }); setShowAddCampo(false);
  };

  const handleSaveLote = async () => {
    if (!geoForm.name || !selectedCampo) return;
    const { area, perimeter } = calculateGeometrics(geoForm.bounds);
    await addDoc(collection(db, 'artifacts', appId, 'users', userId, 'lotes'), { nombre: geoForm.name, campoId: selectedCampo.id, cultivation: '', hacienda: 0, boundaries: geoForm.bounds, area, perimeter, categories: DEFAULT_CATS.map(c=>({...c})) });
    setGeoForm({ name: '', bounds: [] }); setShowAddLote(false);
  };

  const handleSaveRain = async () => {
    const fieldPluvio = pluvios.find(p => p.campoId === selectedCampo.id);
    const entry = { mm: parseFloat(rainForm.mm), date: new Date(rainForm.date).getTime() };
    if (fieldPluvio) { await updateDoc(doc(db, 'artifacts', appId, 'users', userId, 'pluvios', fieldPluvio.id), { history: [...(fieldPluvio.history || []), entry] }); } 
    else { await addDoc(collection(db, 'artifacts', appId, 'users', userId, 'pluvios'), { campoId: selectedCampo.id, history: [entry] }); }
    await addDoc(collection(db, 'artifacts', appId, 'users', userId, 'registros'), { tipo: 'pluvio', desc: `LLUVIA: ${rainForm.mm} mm registrados el ${rainForm.date}`, metadata: { timestamp: Date.now() }, campoId: selectedCampo.id });
    setShowAddRain(false); setRainForm({ mm: '', date: new Date().toISOString().split('T')[0] });
  };

  const handleSaveStation = async () => {
    if (!stationForm.stationId) return;
    await addDoc(collection(db, 'artifacts', appId, 'users', userId, 'estaciones'), { ...stationForm, campoId: selectedCampo.id, gps: stationForm.bounds[0] || { lat: 0, lng: 0 } });
    setShowAddStation(false); setStationForm({ name: '', service: 'wunderground', stationId: '', bounds: [] }); setScannedStations([]);
  };

  const getRainStatsAtDate = (history, dateStr) => {
    if (!history || history.length === 0) return { day: 0, week: 0, month: 0, year: 0 };
    const ref = new Date(dateStr); ref.setHours(23,59,59,999); const refT = ref.getTime();
    const dayStartT = new Date(dateStr).setHours(0,0,0,0);
    const weekStartT = refT - (7 * 86400000);
    const monthStartT = new Date(ref.getFullYear(), ref.getMonth(), 1).getTime();
    const yearStartT = new Date(ref.getFullYear(), 0, 1).getTime();
    const sum = (arr) => arr.reduce((s, x) => s + (parseFloat(x.mm) || 0), 0);
    return { day: sum(history.filter(h => h.date >= dayStartT && h.date <= refT)), week: sum(history.filter(h => h.date >= weekStartT && h.date <= refT)), month: sum(history.filter(h => h.date >= monthStartT && h.date <= refT)), year: sum(history.filter(h => h.date >= yearStartT && h.date <= refT)) };
  };

  const fetchWeather = async (stationId) => {
      try {
        const res = await fetch(`https://api.weather.com/v2/pws/observations/current?stationId=${stationId}&format=json&units=m&apiKey=${WUNDERGROUND_API_KEY}`);
        if (!res.ok) throw new Error("API failed");
        const data = await res.json();
        if (data.observations && data.observations.length > 0) return data.observations[0];
        return null;
      } catch (err) {
        return null; 
      }
  };

  const fieldStations = estaciones.filter(e => e.campoId === selectedCampo?.id);
  const rainHistory = pluvios.find(p => p.campoId === selectedCampo?.id)?.history || [];
  const stats = getRainStatsAtDate(rainHistory, refDate);
  
  const chartData = useMemo(() => {
    const data = []; const ref = new Date(refDate);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(ref); d.setDate(d.getDate() - i); const dayT = d.setHours(0,0,0,0);
      const manual = rainHistory.find(h => new Date(h.date).setHours(0,0,0,0) === dayT)?.mm || 0;
      data.push({ name: d.toLocaleDateString('es-AR', { weekday: 'short' }), Manual: manual });
    }
    return data;
  }, [rainHistory, refDate]);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-6 duration-500 pb-32 px-1 pt-2 leading-none">
      {view === 'list' ? (
        <div className="space-y-4 leading-none">
          <header className="flex justify-between items-end px-2 pt-2 leading-none mb-2">
            <div className="leading-none"><h2 className="text-2xl font-black text-slate-800 tracking-tight italic uppercase">Campos</h2><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Establecimientos</p></div>
            <button onClick={() => setShowAddCampo(true)} className="bg-emerald-900 text-white p-3 rounded-xl shadow-md active:scale-95 flex items-center justify-center leading-none"><Plus size={20}/></button>
          </header>
          <div className="space-y-3 px-1 leading-none">
            {campos.sort((a,b)=> (b.createdAt || 0) - (a.createdAt || 0)).map(c => (
              <Card key={c.id} onClick={() => { setSelectedCampo(c); setView('campo_detail'); }} className="flex justify-between items-center group shadow-sm p-4 bg-white leading-none">
                 <div className="flex items-center gap-4 leading-none"><MapPolygonPreview coordinates={c.boundaries} className="w-16 h-16 shadow-sm border border-slate-100" simple /><div className="space-y-1.5 flex-1 leading-none"><h4 className="text-sm font-black text-slate-800 uppercase tracking-tighter truncate w-32">{String(c.nombre)}</h4><div className="flex items-center gap-2 font-black text-[8px] text-slate-400 uppercase tracking-widest leading-none leading-none"><span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md border border-emerald-100 flex items-center gap-1 leading-none"><Maximize size={10}/> {c.area || '0.00'} Ha</span><span className="bg-slate-50 text-slate-600 px-2 py-1 rounded-md border border-slate-200 flex items-center gap-1 leading-none"><Layers size={10}/> {lotes.filter(l=>l.campoId===c.id).length} Lts</span></div></div></div><ChevronRight size={20} className="text-slate-300 group-hover:text-emerald-500 transition-all" />
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 leading-none">
           <header className="flex justify-between items-center px-2 pt-2 leading-none"><button onClick={() => setView('list')} className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 active:scale-95 transition-all leading-none"><ChevronRight className="rotate-180" size={14}/> Volver</button><h3 className="text-xs font-black text-slate-800 uppercase tracking-widest leading-none">{String(selectedCampo?.nombre)}</h3></header>
           <section className="relative px-1 leading-none"><MapPolygonPreview coordinates={selectedCampo?.boundaries} className="h-48 shadow-md border-2 border-white" markers={fieldStations.map(s => ({...s.gps, label: s.name}))} /><div className="absolute top-3 left-3 flex flex-col gap-1.5 leading-none"><Badge color="bg-emerald-600 text-white shadow-sm">Vista Satelital</Badge><div className="bg-slate-900/90 text-white backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 flex flex-col leading-none"><p className="text-[7px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-1 leading-none">Dimensión Total</p><p className="text-[10px] font-black leading-none">{String(selectedCampo?.area)} Ha • {String(selectedCampo?.perimeter)} m</p></div></div></section>

           <section className="space-y-3 px-1 leading-none">
              <div className="flex justify-between items-center px-2 leading-none"><div className="flex items-center gap-2.5 leading-none leading-none"><div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 leading-none"><Droplets size={18} /></div><h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] leading-none">Pluviometría y Clima</h4></div><div className="flex gap-2 leading-none"><button onClick={() => setShowAddStation(true)} className="p-2 bg-blue-500 text-white rounded-xl shadow-sm active:scale-95 transition-all leading-none"><Thermometer size={16}/></button><button onClick={() => setShowAddRain(true)} className="p-2 bg-blue-50 text-blue-600 rounded-xl shadow-sm border border-blue-200 active:scale-95 transition-all leading-none"><Plus size={16}/></button></div></div>
              
              {fieldStations.map((station) => (
                <WeatherDashboard key={station.id} station={station} fetcher={fetchWeather} />
              ))}

              <div className="grid grid-cols-4 gap-2 px-1 leading-none"><div className="bg-blue-600 text-white p-3 rounded-xl text-center shadow-sm leading-none"><p className="text-[6px] font-black uppercase opacity-70 mb-1 leading-none">Día</p><p className="text-sm font-black leading-none">{String(stats.day)} <span className="text-[6px] opacity-60">mm</span></p></div><div className="bg-blue-700 text-white p-3 rounded-xl text-center shadow-sm leading-none"><p className="text-[6px] font-black uppercase opacity-70 mb-1 leading-none">Semana</p><p className="text-sm font-black leading-none">{String(stats.week)} <span className="text-[6px] opacity-60">mm</span></p></div><div className="bg-blue-800 text-white p-3 rounded-xl text-center shadow-sm leading-none"><p className="text-[6px] font-black uppercase opacity-70 mb-1 leading-none">Mes</p><p className="text-sm font-black leading-none">{String(stats.month)} <span className="text-[6px] opacity-60">mm</span></p></div><div className="bg-slate-800 text-white p-3 rounded-xl text-center shadow-sm leading-none"><p className="text-[6px] font-black uppercase opacity-70 mb-1 leading-none">Anual</p><p className="text-sm font-black leading-none">{String(stats.year)} <span className="text-[6px] opacity-60">mm</span></p></div></div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center gap-2 shadow-sm leading-none"><p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none leading-none">Referencia Histórica:</p><input type="date" className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 font-bold text-[10px] text-blue-700 outline-none leading-none" value={refDate} onChange={(e) => setRefDate(e.target.value)} /></div>
              
              <div className="h-40 w-full bg-white p-3 rounded-xl shadow-sm border border-slate-200 leading-none">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3 leading-none">Evolución de Lluvias (Registro Manual):</p>
                <ResponsiveContainer width="100%" height="80%">
                  <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="name" fontSize={7} axisLine={false} tickLine={false} /><YAxis fontSize={7} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '10px' }} /><Bar dataKey="Manual" fill="#3b82f6" radius={[2, 2, 0, 0]} /></BarChart>
                </ResponsiveContainer>
              </div>

           </section>

           <section className="space-y-3 px-1 leading-none"><div className="flex justify-between items-center px-2 leading-none"><div className="flex items-center gap-2.5 leading-none leading-none"><div className="p-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl leading-none"><Layers size={18} /></div><h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] leading-none">Cuadros del Campo</h4></div><button onClick={() => setShowAddLote(true)} className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 active:scale-95 flex items-center justify-center leading-none"><Plus size={16}/></button></div>
              <div className="grid grid-cols-1 gap-3 px-1 pb-10 leading-none">
                 {lotes.filter(l => l.campoId === selectedCampo?.id).map(l => (<Card key={l.id} onClick={() => { setViewingLote(l); setExpandStock(false); }} className="border-l-4 border-l-emerald-500 flex items-center gap-4 p-4 bg-white shadow-sm leading-none"><MapPolygonPreview coordinates={l.boundaries} className="w-16 h-16 shrink-0 shadow-sm border border-slate-100" simple /><div className="flex-1 space-y-1.5 leading-none"><h4 className="text-sm font-black text-slate-800 uppercase tracking-tight truncate leading-none">{String(l.nombre)}</h4><div className="flex gap-2 flex-wrap leading-none"><Badge color="bg-emerald-50 text-emerald-700 border border-emerald-200 leading-none">{String(l.area)} Ha</Badge><Badge color="bg-slate-50 text-slate-600 border border-slate-200 leading-none">{String(l.hacienda || 0)} Cab.</Badge></div></div><ChevronRight size={20} className="text-slate-300 group-hover:text-emerald-500 transition-colors" /></Card>))}
              </div>
           </section>
        </div>
      )}

      {/* --- MODALES --- */}
      <Modal isOpen={showAddRain} onClose={() => setShowAddRain(false)} title="Registrar Lluvia">
        <div className="space-y-5 pb-4 pt-1 leading-none">
           <input type="number" placeholder="Milímetros (0.0)" className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 font-black text-xl text-blue-600 outline-none" value={rainForm.mm} onChange={e => setRainForm({...rainForm, mm: e.target.value})} />
           <input type="date" className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 font-bold text-sm outline-none" value={rainForm.date} onChange={e => setRainForm({...rainForm, date: e.target.value})} />
           <button onClick={handleSaveRain} className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-md active:scale-95 leading-none">Guardar Registro</button>
        </div>
      </Modal>

      <Modal isOpen={showAddStation} onClose={() => setShowAddStation(false)} title="Vincular Estación IoT">
        <div className="space-y-5 pb-4 pt-1 leading-none">
           <div className="grid grid-cols-1 gap-3 leading-none">
             <input placeholder="Nombre descriptivo" className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs outline-none" value={stationForm.name} onChange={e => setStationForm({...stationForm, name: e.target.value})} />
             <div className="flex gap-2 leading-none">
               <select className="flex-1 p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs outline-none" value={stationForm.service} onChange={e => setStationForm({...stationForm, service: e.target.value})}>{STATION_SERVICES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
               <input placeholder="Station ID" className="flex-[2] p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold text-xs outline-none" value={stationForm.stationId} onChange={e => setStationForm({...stationForm, stationId: e.target.value})} />
             </div>
           </div>
           
           {stationForm.service === 'wunderground' && (
             <div className="space-y-3">
                <button onClick={scanNearbyStations} disabled={isScanning} className="w-full py-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 active:bg-blue-100 transition-all leading-none">{isScanning ? <Activity className="animate-spin" size={14}/> : <Search size={14}/>} {isScanning ? "Buscando..." : "Escanear estaciones cercanas"}</button>
                <div className="relative leading-none">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest px-1 mb-1.5 leading-none">Selecciona un marcador para capturar su ID:</p>
                  <InteractiveMapPicker mode="point" bounds={stationForm.bounds} setBounds={b => setStationForm(f => ({...f, bounds: typeof b === 'function' ? b(f.bounds) : b}))} parentBounds={selectedCampo?.boundaries} className="h-40 leading-none" markers={scannedStations} onMarkerClick={(m) => setStationForm({...stationForm, stationId: m.id, name: `Estación ${m.id}`, bounds: [{lat: m.lat, lng: m.lng}]})} />
                </div>
             </div>
           )}

           {stationForm.service !== 'wunderground' && (
             <>
               <button onClick={() => {
                 const center = selectedCampo?.boundaries[0] || { lat: -31.4, lng: -64.1 };
                 window.open(`https://www.wunderground.com/wundermap?lat=${center.lat}&lon=${center.lng}&zoom=12`, '_blank');
               }} className="w-full py-3 border border-blue-200 text-blue-600 bg-blue-50 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 active:bg-blue-100 leading-none"><Globe size={14}/> Buscar ID en Wundermap (Externa)</button>
               <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest px-1 mb-1.5 leading-none mt-3">Ubica el marcador único de la estación:</p>
               <InteractiveMapPicker mode="point" bounds={stationForm.bounds} setBounds={b => setStationForm(f => ({...f, bounds: typeof b === 'function' ? b(f.bounds) : b}))} parentBounds={selectedCampo?.boundaries} className="h-40 leading-none" />
             </>
           )}
           
           <button onClick={handleSaveStation} className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-[11px] uppercase shadow-md active:scale-95 leading-none mt-2">Vincular a BITCAMPO</button>
        </div>
      </Modal>

      <Modal isOpen={showAddCampo} onClose={() => setShowAddCampo(false)} title="Nuevo Establecimiento"><div className="space-y-5 pb-4 px-1 pt-1 leading-none"><input placeholder="Nombre Campo" className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 font-bold text-sm outline-none" value={geoForm.name} onChange={e => setGeoForm({...geoForm, name: e.target.value})} /><InteractiveMapPicker bounds={geoForm.bounds} setBounds={b => setGeoForm(f => ({...f, bounds: typeof b === 'function' ? b(f.bounds) : b}))} className="h-64 leading-none" /><button onClick={handleSaveCampo} className="w-full bg-emerald-900 text-white py-4 rounded-xl font-black text-[11px] uppercase shadow-md active:scale-95 mt-2 leading-none">Confirmar Campo</button></div></Modal>
      <Modal isOpen={showAddLote} onClose={() => setShowAddLote(false)} title="Nueva Parcela"><div className="space-y-5 pb-4 px-1 pt-1 leading-none"><input placeholder="Nombre Lote" className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 font-bold text-sm outline-none leading-none" value={geoForm.name} onChange={e => setGeoForm({...geoForm, name: e.target.value})} /><InteractiveMapPicker bounds={geoForm.bounds} setBounds={b => setGeoForm(f => ({...f, bounds: typeof b === 'function' ? b(f.bounds) : b}))} parentBounds={selectedCampo?.boundaries} className="h-64 leading-none" /><button onClick={handleSaveLote} className="w-full bg-emerald-900 text-white py-4 rounded-xl font-black text-[11px] uppercase shadow-md active:scale-95 mt-2 leading-none">Crear Lote</button></div></Modal>
      
      <Modal isOpen={!!viewingLote} onClose={() => setViewingLote(null)} title={`Ficha: ${viewingLote?.nombre}`}>
         <div className="space-y-6 pb-24 px-1 pt-2 leading-none">
            <div className="grid grid-cols-2 gap-2 leading-none">
               <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 shadow-sm leading-none"><p className="text-[8px] font-black text-emerald-700 uppercase mb-1.5 tracking-widest leading-none">Superficie</p><p className="text-sm font-black text-slate-800 leading-none">{String(viewingLote?.area)} Ha</p><p className="text-[8px] font-bold text-slate-500 uppercase mt-1.5 leading-none">{String(viewingLote?.perimeter)} m perim.</p></div>
               <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm leading-none"><p className="text-[8px] font-black text-blue-700 uppercase mb-1.5 tracking-widest leading-none">Carga Ganadera</p><p className="text-sm font-black text-slate-800 leading-none">{(parseFloat(viewingLote?.hacienda || 0) / (parseFloat(viewingLote?.area) || 1)).toFixed(2)} cab/Ha</p></div>
            </div>
            
            <section className="space-y-3 leading-none">
               <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-2 leading-none">Existencias</h4>
               <div onClick={() => setExpandStock(!expandStock)} className="bg-slate-800 text-white rounded-xl p-5 shadow-md transition-all active:scale-[0.98] cursor-pointer leading-none">
                  <div className="flex justify-between items-center leading-none"><div className="flex items-center gap-3 leading-none"><div className="bg-emerald-500 p-2.5 rounded-lg shadow-sm leading-none"><Beef size={20} /></div><div className="leading-none"><p className="text-xl font-black leading-none">{String(viewingLote?.hacienda || 0)} <span className="text-[9px] opacity-50 uppercase ml-1 font-bold">Total</span></p></div></div><ChevronDown className={`transition-transform duration-300 text-slate-400 ${expandStock ? 'rotate-180' : ''}`} /></div>
                  {expandStock && (
                     <div className="animate-in slide-in-from-top-4 duration-300 space-y-4 pt-4 border-t border-slate-700 mt-4 leading-none">
                        <div className="grid grid-cols-2 gap-y-3 gap-x-4 leading-none">{(viewingLote?.categories || []).filter(c => (parseInt(c.count) || 0) > 0).map((cat, idx) => (<div key={idx} className="flex justify-between items-center bg-slate-700/50 p-2.5 rounded-lg border border-slate-600 leading-none"><span className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none">{String(cat.name)}</span><span className="text-xs font-black text-white leading-none">{String(cat.count)}</span></div>))}</div>
                        <button onClick={(e) => { e.stopPropagation(); setMovementContext({ from: viewingLote }); setActiveTab('manga'); }} className="w-full bg-emerald-600 text-white py-4 rounded-lg font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-sm active:bg-emerald-500 transition-colors leading-none mt-2"><ArrowRightLeft size={14}/> Iniciar Traslado</button>
                     </div>
                  )}
               </div>
            </section>
            
            <button onClick={() => setLoteToDelete(viewingLote)} className="w-full py-4 text-red-500 font-black text-[10px] uppercase tracking-widest bg-red-50 border border-red-100 rounded-xl flex items-center justify-center gap-2 transition-all active:bg-red-100 shadow-sm mt-4">
               <Trash2 size={16}/> Eliminar Lote
            </button>
         </div>
      </Modal>

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN DE LOTE */}
      <Modal isOpen={!!loteToDelete} onClose={() => setLoteToDelete(null)} title="Confirmar Eliminación">
        <div className="space-y-5 pb-4 pt-1 text-center leading-none">
          <div className="bg-red-50 p-5 rounded-xl border border-red-200 text-red-900 space-y-2 leading-none">
            <div className="flex items-center justify-center gap-2 font-black text-[11px] uppercase leading-none"><AlertTriangle size={16}/> Advertencia</div>
            <p className="text-[11px] leading-relaxed font-medium italic leading-none">¿Estás seguro de que deseas eliminar este lote? Esta acción no se puede deshacer.</p>
          </div>
          <div className="space-y-2 leading-none">
            <button onClick={async () => {
              await deleteDoc(doc(db, 'artifacts', appId, 'users', userId, 'lotes', loteToDelete.id));
              setLoteToDelete(null);
              setViewingLote(null);
            }} className="w-full bg-red-600 text-white py-4 rounded-xl font-black text-[10px] uppercase shadow-sm active:scale-95 transition-all leading-none">Sí, Eliminar Lote</button>
            <button onClick={() => setLoteToDelete(null)} className="w-full py-3 text-slate-500 font-bold text-[9px] uppercase active:bg-slate-50 rounded-xl leading-none">Cancelar</button>
          </div>
        </div>
      </Modal>

    </div>
  );
}

function RegistrosSection({ registros, lotes, userId }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ tipo: 'muerte', loteId: '', desc: '', hasPhoto: false });
  const handleSave = async () => {
    if (!form.desc) return;
    await addDoc(collection(db, 'artifacts', appId, 'users', userId, 'registros'), { ...form, metadata: { timestamp: Date.now() } });
    if (form.tipo === 'muerte' && form.loteId) {
      const lot = lotes.find(l => l.id === form.loteId);
      const updatedCats = (lot?.categories || DEFAULT_CATS).map(c => c.name === 'Vacas' ? {...c, count: Math.max(0, (parseInt(c.count)||0)-1)} : c);
      await updateDoc(doc(db, 'artifacts', appId, 'users', userId, 'lotes', form.loteId), { hacienda: increment(-1), categories: updatedCats });
    }
    setForm({ tipo: 'muerte', loteId: '', desc: '', hasPhoto: false }); setShowAdd(false);
  };
  return (
    <div className="space-y-4 animate-in fade-in duration-500 px-1 pb-32 pt-2 leading-none">
      <header className="flex justify-between items-end px-2 pt-2 leading-none mb-4"><div className="leading-none"><h2 className="text-2xl font-black text-slate-800 tracking-tight italic uppercase">Bitácora</h2><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Historial Rural</p></div><button onClick={() => setShowAdd(true)} className="bg-slate-800 text-white p-3 rounded-xl shadow-md active:scale-95 flex items-center justify-center leading-none"><Plus size={20}/></button></header>
      <div className="space-y-3 px-1 leading-none">
        {registros.sort((a,b)=> (b.metadata?.timestamp || 0) - (a.metadata?.timestamp || 0)).map(r => (
          <Card key={r.id} className={`border-l-[8px] bg-white ${r.tipo === 'muerte' ? 'border-l-red-600' : r.tipo === 'siembra' ? 'border-l-emerald-400' : (r.tipo === 'auditoria' || r.tipo === 'conteo' || r.tipo === 'pluvio') ? 'border-l-slate-700' : 'border-l-blue-400'} leading-none`}><div className="flex justify-between items-start leading-none"><div className="space-y-3 flex-1 pr-2 leading-none"><Badge color={r.tipo === 'muerte' ? 'bg-red-50 text-red-700 border border-red-200' : r.tipo === 'siembra' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : (r.tipo === 'auditoria' || r.tipo === 'conteo') ? 'bg-slate-100 text-slate-700 border border-slate-300' : 'bg-blue-50 text-blue-700 border border-blue-200'}>{String(r.tipo)}</Badge><h4 className="text-sm font-black text-slate-800 uppercase tracking-tight leading-tight">{String(r.desc)}</h4><div className="pt-3 border-t border-slate-100 text-[8px] font-black text-slate-400 uppercase tracking-widest space-y-1"><p className="text-slate-600 flex items-center gap-1 leading-none font-bold"><MapPin size={10}/> Lote: {String(lotes.find(l=>l.id===r.loteId)?.nombre || 'General')}</p><p className="leading-none">{new Date(r.metadata?.timestamp).toLocaleDateString()} {new Date(r.metadata?.timestamp).toLocaleTimeString()}</p></div></div><button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'users', userId, 'registros', r.id))} className="text-slate-300 hover:text-red-500 p-2 active:scale-90"><Trash2 size={18}/></button></div></Card>
        ))}
      </div>
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Nuevo Reporte"><div className="space-y-5 pb-4 px-1 pt-1 leading-none"><div className="flex gap-2 leading-none"><button onClick={() => setForm({...form, tipo: 'muerte'})} className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase border-2 transition-all ${form.tipo === 'muerte' ? 'bg-red-50 text-red-700 border-red-300 shadow-sm' : 'bg-white text-slate-400 border-slate-200'} leading-none`}><Skull size={16} className="inline mr-1.5 leading-none"/> Muerte</button><button onClick={() => setForm({...form, tipo: 'daño'})} className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase border-2 transition-all ${form.tipo === 'daño' ? 'bg-amber-50 text-amber-700 border-amber-300 shadow-sm' : 'bg-white text-slate-400 border-slate-200'} leading-none`}><Wind size={16} className="inline mr-1.5 leading-none"/> Daño</button></div><select className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 font-bold text-sm outline-none" value={form.loteId} onChange={e=>setForm({...form, loteId: e.target.value})}><option value="">¿Dónde ocurrió?</option>{lotes.map(l => <option key={l.id} value={l.id}>{String(l.nombre)}</option>)}</select><textarea className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 font-bold text-sm h-24 outline-none resize-none" placeholder="Detalles..." value={form.desc} onChange={e=>setForm({...form, desc: e.target.value})} /><button onClick={() => setForm({...form, hasPhoto: !form.hasPhoto})} className={`w-full p-4 rounded-xl flex items-center justify-center gap-2 text-[9px] font-black uppercase border transition-all ${form.hasPhoto ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-white border-dashed border-slate-300 text-slate-400'} leading-none`}><Camera size={16}/> {form.hasPhoto ? "FOTO ADJUNTA" : "AÑADIR FOTO"}</button><button onClick={handleSave} className="w-full bg-slate-800 text-white py-5 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-md active:scale-95 leading-none mt-2">Guardar Reporte</button></div></Modal>
    </div>
  );
}

// --- PANTALLA DE LOGIN PROFESIONAL ---
function LoginScreen({ onGuestLogin, onGoogleLogin, loading, error }) {
  return (
    <div className="flex h-screen items-center justify-center bg-[#F8FAFC] font-sans text-slate-900 px-6">
      <div className="flex flex-col items-center w-full max-w-xs animate-in fade-in zoom-in duration-500">
        <div className="bg-emerald-900 p-5 rounded-3xl shadow-xl flex items-center justify-center mb-6">
          <Beef size={48} className="text-emerald-400" />
        </div>
        <h1 className="text-3xl font-black tracking-tighter italic uppercase text-slate-800 mb-1">BIT<span className="text-emerald-500">CAMPO</span></h1>
        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 mb-10">Precisión Rural</p>
        
        {error && (
          <div className="w-full bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-[10px] font-bold leading-relaxed mb-4 text-center">
            {error}
          </div>
        )}
        
        <div className="space-y-3 w-full">
          <button 
            onClick={onGoogleLogin} 
            disabled={loading}
            className="w-full bg-white border border-slate-200 text-slate-700 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? <Activity className="animate-spin text-slate-400" size={16}/> : <Globe size={16} className="text-blue-500"/>}
            Acceder con Google
          </button>
          
          <button 
            onClick={onGuestLogin} 
            disabled={loading}
            className="w-full bg-emerald-800 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:bg-emerald-900 active:scale-95 transition-all disabled:opacity-50 shadow-md"
          >
            {loading ? <Activity className="animate-spin text-emerald-400" size={16}/> : <User size={16} className="text-emerald-400"/>}
            Continuar como Invitado
          </button>
        </div>
        <p className="text-[9px] font-bold text-slate-400 mt-8 leading-relaxed px-4 text-center">Tus datos se guardarán de forma privada y segura en la nube.</p>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('tareas');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [movementContext, setMovementContext] = useState(null);
  
  // Header Scroll State
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  const [campos, setCampos] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [hacienda, setHacienda] = useState([]);
  const [pluvios, setPluvios] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [estaciones, setEstaciones] = useState([]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) { 
          await signInWithCustomToken(auth, __initial_auth_token); 
        }
      } catch (e) {
        console.warn("Auth init warning:", e.message);
      }
    };
    initAuth();
    
    const unsub = onAuthStateChanged(auth, (u) => { 
      setUser(u); 
      setLoading(false); 
    });
    return () => unsub();
  }, []);

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    setLoginError('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.warn("Google Login bloqueado por seguridad del entorno:", e.message);
      if (e.code === 'auth/unauthorized-domain') {
        setLoginError("Este dominio no está autorizado en Firebase. Configura lecranc.github.io en Firebase Console > Authentication > Authorized domains.");
      } else if (e.code === 'auth/popup-closed-by-user') {
        setLoginError("Cerraste la ventana de login. Intenta de nuevo.");
      } else {
        setLoginError("Ocurrió un error al iniciar sesión: " + e.message);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setAuthLoading(true);
    setLoginError('');
    try {
      await signInAnonymously(auth);
    } catch (e) {
      console.warn("Error en Guest Login:", e.message);
      setLoginError("No se pudo acceder al sistema.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleScroll = (e) => {
    const currentScrollY = e.target.scrollTop;
    if (currentScrollY > lastScrollY && currentScrollY > 50) {
      setShowHeader(false); // Ocultar al bajar
    } else if (currentScrollY < lastScrollY) {
      setShowHeader(true);  // Mostrar al subir
    }
    setLastScrollY(currentScrollY);
  };

  useEffect(() => {
    if (!user) return;
    const userPath = ['artifacts', appId, 'users', user.uid];
    
    const unsubCampos = onSnapshot(collection(db, ...userPath, 'campos'), (s) => setCampos(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubLotes = onSnapshot(collection(db, ...userPath, 'lotes'), (s) => setLotes(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubTareas = onSnapshot(collection(db, ...userPath, 'tareas'), (s) => setTareas(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubHacienda = onSnapshot(collection(db, ...userPath, 'hacienda'), (s) => setHacienda(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubPluvios = onSnapshot(collection(db, ...userPath, 'pluvios'), (s) => setPluvios(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubRegs = onSnapshot(collection(db, ...userPath, 'registros'), (s) => setRegistros(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubEstaciones = onSnapshot(collection(db, ...userPath, 'estaciones'), (s) => setEstaciones(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    
    return () => { unsubCampos(); unsubLotes(); unsubTareas(); unsubHacienda(); unsubPluvios(); unsubRegs(); unsubEstaciones(); };
  }, [user]);

  if (loading) return (<div className="flex h-screen items-center justify-center bg-[#F8FAFC] px-10 text-center"><Activity className="animate-spin text-emerald-600" size={32}/></div>);

  if (!user) return (
    <LoginScreen 
      onGoogleLogin={handleGoogleLogin} 
      onGuestLogin={handleGuestLogin} 
      loading={authLoading}
      error={loginError}
    />
  );

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] font-sans text-slate-900 max-w-md mx-auto shadow-2xl overflow-hidden relative border-x border-slate-200">
      
      {/* HEADER DINÁMICO */}
      <header className={`absolute top-0 left-0 right-0 bg-emerald-900 text-white p-4 pt-10 rounded-b-2xl shadow-md z-50 transition-transform duration-300 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-800 rounded-lg shadow-inner border border-emerald-700/50">
               <Beef size={20} className="text-emerald-400" />
            </div>
            <h1 className="text-xl font-black tracking-tighter italic uppercase mt-0.5">BIT<span className="text-emerald-400">CAMPO</span></h1>
          </div>
          <button onClick={() => auth.signOut()} className="bg-white/10 p-2 rounded-lg border border-white/10 active:bg-white/20 transition-all flex items-center justify-center">
            {user.isAnonymous ? <User size={16} className="text-emerald-200" /> : <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}&background=10b981&color=fff`} alt="user" className="w-4 h-4 rounded-full"/>}
          </button>
        </div>
      </header>

      {/* CONTENEDOR PRINCIPAL */}
      <main onScroll={handleScroll} className="flex-1 overflow-y-auto bg-slate-50/50 pt-24 pb-28 relative scroll-smooth">
        {activeTab === 'tareas' && <TareasSection tareas={tareas} lotes={lotes} userId={user.uid} />}
        {activeTab === 'manga' && (<MangaSection hacienda={hacienda} lotes={lotes} movementContext={movementContext} setMovementContext={setMovementContext} setActiveTab={setActiveTab} userId={user.uid} />)}
        {activeTab === 'campos' && (<CamposSection campos={campos} lotes={lotes} pluvios={pluvios} registros={registros} estaciones={estaciones} setActiveTab={setActiveTab} setMovementContext={setMovementContext} userId={user.uid} />)}
        {activeTab === 'registros' && <RegistrosSection registros={registros} lotes={lotes} userId={user.uid} />}
      </main>

      {/* NAVEGACIÓN INFERIOR */}
      <div className="fixed bottom-4 left-0 right-0 z-[60] flex justify-center px-4 max-w-md mx-auto">
        <nav className="bg-slate-900 border border-white/10 rounded-2xl flex justify-around w-full py-3 px-1 shadow-[0_15px_30px_rgba(0,0,0,0.4)] backdrop-blur-xl opacity-[0.98]">
          <NavBtn icon={<ClipboardList />} label="Tareas" active={activeTab === 'tareas'} onClick={() => setActiveTab('tareas')} />
          <NavBtn icon={<Beef />} label="Manga" active={activeTab === 'manga'} onClick={() => setActiveTab('manga')} />
          <NavBtn icon={<MapIcon />} label="Campos" active={activeTab === 'campos'} onClick={() => setActiveTab('campos')} />
          <NavBtn icon={<FileText />} label="Bitácora" active={activeTab === 'registros'} onClick={() => setActiveTab('registros')} />
        </nav>
      </div>
    </div>
  );
}
