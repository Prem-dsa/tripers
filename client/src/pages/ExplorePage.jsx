import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass, MapPin, Star, Globe, Zap, Lightbulb, ScanText, Bell, Plane, Wallet,
  ArrowDownToLine, Hourglass, Bot, Sun, Cloud, Wind, Thermometer, Sunset, Sunrise,
  Hotel, UtensilsCrossed, Sparkles, Navigation, Send, ArrowRight, ShieldCheck, Ticket, Landmark, Palmtree, ShoppingBag
} from 'lucide-react';
import { tripApi, userApi } from '../api';
import { GlassCard, EmptyState, Badge } from '../components/ui/index';
import { formatCurrency } from '../utils/currency';
import { useAuthStore } from '../store/authStore';

const DESTINATIONS = [
  {
    name: 'Kyoto, Japan',
    category: 'Culture & Parks',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    weather: '22°C Clear',
    avgBudget: '₹4,500/day',
    tags: ['Temples', 'Ramen', 'Cherry Blossom', 'Gardens'],
    popularFor: 'Parks & Museums',
  },
  {
    name: 'Santorini, Greece',
    category: 'Beaches & Romance',
    image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=600&q=80',
    rating: 4.95,
    weather: '27°C Sunny',
    avgBudget: '₹8,200/day',
    tags: ['Sunsets', 'Wine Tasting', 'Caldera Views', 'Luxury'],
    popularFor: 'Beaches',
  },
  {
    name: 'Zermatt, Switzerland',
    category: 'Adventure & Mountains',
    image: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=600&q=80',
    rating: 4.88,
    weather: '8°C Snow',
    avgBudget: '₹12,000/day',
    tags: ['Skiing', 'Matterhorn', 'Hiking', 'Fondue'],
    popularFor: 'Parks',
  },
  {
    name: 'Bali, Indonesia',
    category: 'Tropical & Beaches',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=600&q=80',
    rating: 4.82,
    weather: '30°C Warm',
    avgBudget: '₹3,200/day',
    tags: ['Surfing', 'Villas', 'Ubud Rice Terraces', 'Beach Clubs'],
    popularFor: 'Beaches & Shopping',
  },
];

const FLIGHTS = [
  { id: 'FL-902', airline: 'Air India', route: 'BOM → HND (Tokyo)', status: 'On Time', gate: 'B14', departure: '10:45 AM', duration: '8h 30m' },
  { id: 'FL-410', airline: 'Emirates', route: 'DEL → CDG (Paris)', status: 'Boarding', gate: 'A08', departure: '01:15 PM', duration: '9h 15m' },
  { id: 'FL-771', airline: 'Singapore Airlines', route: 'BLR → SIN (Singapore)', status: 'Scheduled', gate: 'C22', departure: '11:30 PM', duration: '4h 45m' },
];

const HOTELS = [
  { name: 'The Ritz Carlton Tokyo', location: 'Minato City, Tokyo', rating: 4.9, price: '₹42,000/night', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=500&q=80' },
  { name: 'Grace Hotel Santorini', location: 'Imerovigli, Greece', rating: 4.96, price: '₹58,000/night', image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=500&q=80' },
];

export default function ExplorePage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('explore');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiMessages, setAiMessages] = useState([
    { sender: 'ai', text: `Hello ${user?.fullName || 'Traveler'}! I am your AI Travel Concierge. Ask me for custom itinerary planning, budget optimization, flight advice, or hotel recommendations!` }
  ]);
  const [filterCategory, setFilterCategory] = useState('All');

  const { data: dashData, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => userApi.getDashboard().then(r => r.data),
  });

  const { data: tripsData } = useQuery({
    queryKey: ['trips', '', ''],
    queryFn: () => tripApi.getAll({}).then(r => r.data),
  });

  const stats = dashData?.stats;
  const trips = tripsData?.trips || [];

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    const userQuery = aiPrompt;
    setAiMessages(prev => [...prev, { sender: 'user', text: userQuery }]);
    setAiPrompt('');

    setTimeout(() => {
      let aiResponse = `Here are my AI travel recommendations for "${userQuery}":\n\n• Top Spot: Kyoto & Tokyo 7-Day Experience\n• Budget Advice: Book flights 6 weeks in advance to save up to 25%.\n• Best Dining: Gion District Izakayas (avg ₹1,200/person).\n• Weather Tip: Spring (March-May) offers pleasant 18-24°C temperatures with cherry blossoms!`;
      setAiMessages(prev => [...prev, { sender: 'ai', text: aiResponse }]);
    }, 800);
  };

  const categories = ['All', 'Beaches', 'Parks & Museums', 'Shopping', 'Adventure'];

  const filteredDestinations = filterCategory === 'All'
    ? DESTINATIONS
    : DESTINATIONS.filter(d => d.popularFor.toLowerCase().includes(filterCategory.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-2 sm:px-4 pb-16 text-white">
      {/* Top Banner Header */}
      <motion.div
        className="relative rounded-[36px] overflow-hidden p-8 sm:p-10 bg-white/10 backdrop-blur-[36px] border border-white/20 shadow-2xl"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-indigo-500/30 to-purple-500/20 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-pink-500/20 rounded-full blur-[70px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-[18px] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-glow">
                <Compass size={24} className="text-white animate-spin-slow" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">Explore & AI Travel Hub</h1>
                <p className="text-indigo-300 text-[11px] font-bold uppercase tracking-[0.2em]">Smart Itineraries • Weather • Flights • Hotels</p>
              </div>
            </div>
          </div>

          {/* Tab Pill Navigation */}
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-1.5 rounded-full border border-white/20 overflow-x-auto no-scrollbar">
            {[
              { id: 'explore', label: 'Destinations', icon: Globe },
              { id: 'ai', label: 'AI Concierge', icon: Bot },
              { id: 'weather', label: 'Weather Radar', icon: Sun },
              { id: 'flights', label: 'Flights & Hotels', icon: Plane },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[12px] font-bold uppercase tracking-wider transition-all duration-300 ${
                    active
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-glow'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon size={15} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick KPI stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
          {[
            { label: 'Total Trips', value: (stats?.tripsCreated || 0) + (stats?.tripsJoined || 0), icon: <Plane size={16} className="text-indigo-400" /> },
            { label: 'Total Paid', value: stats ? `₹${formatCurrency(stats.totalPaid)}` : '—', icon: <Wallet size={16} className="text-emerald-400" /> },
            { label: 'To Receive', value: stats ? `₹${formatCurrency(stats.totalToReceive)}` : '—', icon: <ArrowDownToLine size={16} className="text-amber-400" /> },
            { label: 'Pending Reminders', value: stats?.pendingSettlements ?? '0', icon: <Hourglass size={16} className="text-pink-400" /> },
          ].map((item, i) => (
            <div key={i} className="bg-white/10 border border-white/15 p-4 rounded-[22px] text-center backdrop-blur-md">
              <div className="w-8 h-8 rounded-[12px] bg-white/10 flex items-center justify-center mx-auto mb-2 border border-white/20">
                {item.icon}
              </div>
              <p className="text-lg font-extrabold text-white">{item.value}</p>
              <p className="text-slate-400 text-[10px] mt-0.5 font-bold uppercase tracking-widest">{item.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Main Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'explore' && (
          <motion.div
            key="explore"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Category Filter Pills */}
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-5 py-2 rounded-full text-[12px] font-bold transition-all duration-300 uppercase tracking-wider ${
                    filterCategory === cat
                      ? 'bg-white text-slate-900 shadow-glow font-extrabold'
                      : 'bg-white/10 text-slate-300 border border-white/20 hover:bg-white/20'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Destination Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredDestinations.map((item, idx) => (
                <GlassCard key={idx} className="!p-0 overflow-hidden group hover:scale-[1.02] transition-all duration-300">
                  <div className="h-48 w-full relative overflow-hidden">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                    <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md border border-white/30 text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Star size={12} className="text-amber-400 fill-amber-400" /> {item.rating}
                    </div>
                    <div className="absolute bottom-3 left-4">
                      <Badge variant="primary" className="text-[10px]">{item.category}</Badge>
                      <h3 className="text-xl font-extrabold text-white mt-1 leading-tight">{item.name}</h3>
                    </div>
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
                      <span>Weather: <strong className="text-white">{item.weather}</strong></span>
                      <span>Est: <strong className="text-emerald-400">{item.avgBudget}</strong></span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {item.tags.map((tag, tIdx) => (
                        <span key={tIdx} className="text-[10px] font-bold bg-white/10 text-indigo-300 border border-white/15 px-2.5 py-1 rounded-full">
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <button className="w-full btn-primary py-2.5 rounded-full text-xs uppercase font-bold tracking-wider mt-2 shadow-glow">
                      Plan Trip Here
                    </button>
                  </div>
                </GlassCard>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'ai' && (
          <motion.div
            key="ai"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            <GlassCard className="lg:col-span-2 flex flex-col h-[560px] !p-6">
              <div className="flex items-center gap-3 pb-4 border-b border-white/15">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-glow">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">Tripers AI Assistant</h3>
                  <p className="text-indigo-300 text-[11px] font-bold uppercase tracking-wider">Powered by Deep Intelligence</p>
                </div>
              </div>

              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto space-y-4 my-4 no-scrollbar pr-2">
                {aiMessages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.sender === 'ai' && (
                      <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 flex-shrink-0">
                        <Sparkles size={14} />
                      </div>
                    )}
                    <div className={`p-4 rounded-[22px] max-w-md text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium shadow-glow'
                        : 'bg-white/10 border border-white/20 text-slate-200 backdrop-blur-md'
                    }`}>
                      {msg.text.split('\n').map((line, lIdx) => (
                        <p key={lIdx} className="mb-1">{line}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Prompt Input Form */}
              <form onSubmit={handleSendMessage} className="flex gap-3 pt-3 border-t border-white/15">
                <input
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ask AI for travel tips, budget splits, or top restaurants..."
                  className="flex-1 input rounded-full py-3.5 px-6 text-sm"
                />
                <button type="submit" className="btn-primary rounded-full px-6 py-3.5 shadow-glow">
                  <Send size={16} />
                </button>
              </form>
            </GlassCard>

            {/* Quick AI Suggestions */}
            <GlassCard className="space-y-4 !p-6">
              <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-[0.2em] border-b border-white/15 pb-3">AI Quick Prompts</h3>
              {[
                { title: 'Tokyo 5-Day Budget Plan', desc: 'Detailed itinerary under ₹50,000 with ramen spots & subway passes.' },
                { title: 'Best Beach Resorts in Bali', desc: 'Top rated beachfront villas with infinity pools & scooter rentals.' },
                { title: 'Split Villa Cost for 6 People', desc: 'Optimized minimum cash flow settlement calculation.' },
                { title: 'European Summer Travel Tips', desc: 'Schengen visa timeline, train passes, and packing checklist.' },
              ].map((p, i) => (
                <div
                  key={i}
                  onClick={() => setAiPrompt(p.title)}
                  className="p-4 rounded-[20px] bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer group"
                >
                  <p className="text-white text-xs font-bold group-hover:text-indigo-300 transition-colors">{p.title}</p>
                  <p className="text-slate-400 text-[11px] mt-1 leading-relaxed font-medium">{p.desc}</p>
                </div>
              ))}
            </GlassCard>
          </motion.div>
        )}

        {activeTab === 'weather' && (
          <motion.div
            key="weather"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <GlassCard className="md:col-span-2 space-y-6 !p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-extrabold text-white">Kyoto, Japan</h3>
                  <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mt-1">Live Destination Weather Radar</p>
                </div>
                <Badge variant="success" className="text-xs px-4 py-1.5">AQI 28 • Excellent</Badge>
              </div>

              <div className="flex items-center gap-8 py-4">
                <Sun size={64} className="text-amber-400 animate-pulse" />
                <div>
                  <span className="text-5xl font-black text-white tracking-tight">22°C</span>
                  <p className="text-slate-300 text-sm font-semibold mt-1">Clear Skies • Humidity 45% • Wind 8 km/h</p>
                </div>
              </div>

              {/* 5 Day Forecast */}
              <div className="border-t border-white/15 pt-6">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">5-Day Travel Forecast</h4>
                <div className="grid grid-cols-5 gap-3 text-center">
                  {[
                    { day: 'Mon', temp: '22°', icon: Sun },
                    { day: 'Tue', temp: '24°', icon: Sun },
                    { day: 'Wed', temp: '19°', icon: Cloud },
                    { day: 'Thu', temp: '21°', icon: Sun },
                    { day: 'Fri', temp: '25°', icon: Sun },
                  ].map((f, i) => {
                    const FIcon = f.icon;
                    return (
                      <div key={i} className="p-3 rounded-[20px] bg-white/10 border border-white/20">
                        <p className="text-slate-300 text-[11px] font-bold uppercase">{f.day}</p>
                        <FIcon size={20} className="text-amber-400 mx-auto my-2" />
                        <p className="text-white font-extrabold text-sm">{f.temp}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </GlassCard>

            <GlassCard className="space-y-4 !p-6">
              <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-[0.2em] border-b border-white/15 pb-3">Sun & Air Metrics</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-[20px] bg-white/10 border border-white/20">
                  <Sunrise size={20} className="text-amber-400" />
                  <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase">Sunrise</p>
                    <p className="text-white text-sm font-bold mt-0.5">05:42 AM</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-[20px] bg-white/10 border border-white/20">
                  <Sunset size={20} className="text-rose-400" />
                  <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase">Sunset</p>
                    <p className="text-white text-sm font-bold mt-0.5">06:38 PM</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-[20px] bg-white/10 border border-white/20">
                  <Wind size={20} className="text-cyan-400" />
                  <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase">UV Index</p>
                    <p className="text-white text-sm font-bold mt-0.5">3 • Moderate</p>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {activeTab === 'flights' && (
          <motion.div
            key="flights"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Flight Tracker */}
            <GlassCard className="space-y-4 !p-6">
              <div className="flex items-center justify-between pb-3 border-b border-white/15">
                <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Plane size={16} className="text-indigo-400" /> Live Flight Status
                </h3>
                <Badge variant="primary" className="text-[10px]">Real-Time Sync</Badge>
              </div>

              <div className="space-y-3">
                {FLIGHTS.map((f) => (
                  <div key={f.id} className="p-4 rounded-[24px] bg-white/10 border border-white/20 hover:bg-white/15 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                          <Plane size={18} />
                        </div>
                        <div>
                          <p className="text-white font-extrabold text-sm">{f.airline}</p>
                          <p className="text-slate-300 text-xs mt-0.5">{f.route}</p>
                        </div>
                      </div>
                      <Badge variant={f.status === 'On Time' ? 'success' : 'warning'}>{f.status}</Badge>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10 text-xs text-slate-300 font-medium">
                      <span>Flight: <strong className="text-white">{f.id}</strong></span>
                      <span>Gate: <strong className="text-indigo-300">{f.gate}</strong></span>
                      <span>Departs: <strong className="text-emerald-400">{f.departure}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Hotel Bookings */}
            <GlassCard className="space-y-4 !p-6">
              <div className="flex items-center justify-between pb-3 border-b border-white/15">
                <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Hotel size={16} className="text-indigo-400" /> Curated Hotel Bookings
                </h3>
                <Badge variant="success" className="text-[10px]">Verified Stays</Badge>
              </div>

              <div className="space-y-4">
                {HOTELS.map((h, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-[24px] bg-white/10 border border-white/20 hover:bg-white/15 transition-all duration-300">
                    <img src={h.image} alt={h.name} className="w-20 h-20 rounded-[18px] object-cover border border-white/20 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-extrabold text-sm truncate">{h.name}</h4>
                      <p className="text-slate-300 text-xs mt-1 truncate">{h.location}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-amber-400 text-xs font-bold flex items-center gap-1">★ {h.rating}</span>
                        <span className="text-emerald-400 text-xs font-extrabold">{h.price}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
