import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Plane, UtensilsCrossed, Home, Car, Waves, Camera, CalendarDays, Luggage, Footprints, Bike, Coffee, Armchair, CalendarPlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCountdown } from '@/hooks/useCountdown';
import { HeroMap } from '@/components/HeroMap';
import data from '@/data.json';
import { cn } from '@/lib/utils';

// --- CATEGORY ---
type Category = {
  icon: React.ElementType;
  label: string;
  bg: string;
  text: string;
  accent: string;     // tailwind bg-* for the icon block
  line: string;       // tailwind bg-* for the timeline line segment
};

function getCategory(title: string, description: string): Category {
  const t = (title + ' ' + description).toLowerCase();
  const tl = title.toLowerCase();
  if (tl.includes('meet up') || tl.includes('meet at') || tl.includes('checkpoint'))
    return { icon: MapPin,          label: 'Meetup',  bg: 'bg-indigo-50',  text: 'text-indigo-600', accent: 'bg-indigo-100',  line: 'bg-indigo-200' };
  if (tl.includes('boarding'))
    return { icon: Luggage,         label: 'Boarding',bg: 'bg-sky-50',     text: 'text-sky-600',    accent: 'bg-sky-100',     line: 'bg-sky-200' };
  if (t.includes('flight') || t.includes('ngurah') || tl.includes('terminal') || tl.includes('arrival') || tl.includes('touchdown'))
    return { icon: Plane,           label: 'Flight',  bg: 'bg-sky-50',     text: 'text-sky-600',    accent: 'bg-sky-100',     line: 'bg-sky-200' };
  if (tl.includes('gigi susu') || tl.includes('kopi') || tl.includes('coffee shop'))
    return { icon: Coffee,         label: 'Coffee',    bg: 'bg-amber-50',   text: 'text-amber-700',  accent: 'bg-amber-100',   line: 'bg-amber-200' };
  if (tl.includes('atv') || tl.includes('quad bike'))
    return { icon: Bike,           label: 'Adventure', bg: 'bg-orange-50',  text: 'text-orange-600', accent: 'bg-orange-100',  line: 'bg-orange-200' };
  if (tl.includes('free time') || tl.includes('last morning'))
    return { icon: Armchair,       label: 'Santai',  bg: 'bg-teal-50',    text: 'text-teal-600',   accent: 'bg-teal-100',    line: 'bg-teal-200' };
  if (tl.includes('stroll') || tl.includes('walk') || tl.includes('jalan-jalan'))
    return { icon: Footprints,      label: 'Stroll',  bg: 'bg-lime-50',    text: 'text-lime-600',   accent: 'bg-lime-100',    line: 'bg-lime-200' };
  if (tl.includes('car') || tl.includes('roadtrip') || tl.includes('head to') || tl.includes('pick up') || tl.includes('pick-up') || t.includes('drive'))
    return { icon: Car,             label: 'Transit', bg: 'bg-slate-100',  text: 'text-slate-500',  accent: 'bg-slate-100',   line: 'bg-slate-200' };
  if (t.includes('lunch') || t.includes('dinner') || t.includes('breakfast') || t.includes('coffee') || t.includes('seafood') || t.includes('pa.di') || t.includes('bebek') || t.includes('pison') || t.includes('nasi') || t.includes('tempong') || t.includes('dimsum'))
    return { icon: UtensilsCrossed, label: 'Dining',  bg: 'bg-amber-50',   text: 'text-amber-600',  accent: 'bg-amber-100',   line: 'bg-amber-200' };
  if (tl.includes('check-in') || tl.includes('check in') || tl.includes('heading home') || tl.includes('grateful') || t.includes('villa') || t.includes('hotel'))
    return { icon: Home,            label: 'Stay',    bg: 'bg-emerald-50', text: 'text-emerald-600',accent: 'bg-emerald-100', line: 'bg-emerald-200' };
  if (t.includes('beach') || t.includes('pantai') || t.includes('melasti') || t.includes('pandawa') || t.includes('jimbaran'))
    return { icon: Waves,           label: 'Beach',   bg: 'bg-cyan-50',    text: 'text-cyan-600',   accent: 'bg-cyan-100',    line: 'bg-cyan-200' };
  return   { icon: Camera,          label: 'Explore', bg: 'bg-violet-50',  text: 'text-violet-600', accent: 'bg-violet-100',  line: 'bg-violet-200' };
}

// --- ADD TO CALENDAR ---
function openGoogleCalendar(weeksBefore: number) {
  const tripDate = new Date('2026-06-12T10:00:00+08:00');
  const reminderDate = new Date(tripDate);
  reminderDate.setDate(reminderDate.getDate() - weeksBefore * 7);

  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const end = new Date(reminderDate);
  end.setHours(end.getHours() + 1);

  const label =
    weeksBefore === 1 ? '1 minggu' :
    weeksBefore === 2 ? '2 minggu' : '1 bulan';

  const title = encodeURIComponent(`🌴 Reminder: Bali Trip ${label} lagi!`);
  const desc = encodeURIComponent(
    `Trip ke Bali udah tinggal ${label} lagi — saatnya cek itinerary, siapin koper, dan pastiin semua beres.\n\n📋 Itinerary lengkap: https://github.com/elvanrafif/bali-countdown\n\n✈️ Keberangkatan: 12 Juni 2026`
  );

  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${fmt(reminderDate)}/${fmt(end)}&details=${desc}`;
  window.open(url, '_blank');
}

function AddToCalendarModal({ onClose }: { onClose: () => void }) {
  const options = [
    { label: '1 minggu sebelum', weeks: 1 },
    { label: '2 minggu sebelum', weeks: 2 },
    { label: '1 bulan sebelum', weeks: 4 },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 10 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="relative bg-white rounded-2xl shadow-2xl p-5 w-full max-w-xs z-10"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-bold text-sm text-foreground">Tambah ke Google Calendar</p>
            <p className="text-xs text-muted-foreground mt-0.5">Pilih kapan mau diingatkan</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-2">
          {options.map(opt => (
            <button
              key={opt.weeks}
              onClick={() => { openGoogleCalendar(opt.weeks); onClose(); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border hover:bg-slate-50 hover:border-cyan-300 transition-all text-sm font-medium text-left group"
            >
              <CalendarDays className="w-4 h-4 text-cyan-500 shrink-0" />
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// --- COUNTDOWN ---
function Countdown({ targetDate }: { targetDate: string }) {
  const time = useCountdown(targetDate);
  const blocks = [
    { label: 'Days',    value: time.days    },
    { label: 'Hours',   value: time.hours   },
    { label: 'Minutes', value: time.minutes },
    { label: 'Seconds', value: time.seconds },
  ];
  return (
    <div className="flex gap-2 sm:gap-3 justify-center lg:justify-start">
      {blocks.map((block, i) => (
        <div key={block.label} className="flex items-center gap-2 sm:gap-3">
          <div className="flex flex-col items-center">
            <div className="bg-white/10 backdrop-blur-sm text-white rounded-xl p-2.5 sm:p-3 w-14 h-16 sm:w-20 sm:h-[5.5rem] flex items-center justify-center relative overflow-hidden border border-white/15 shadow-lg">
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={block.value}
                  initial={{ y: 24, opacity: 0 }}
                  animate={{ y: 0,  opacity: 1 }}
                  exit={{ y: -24,   opacity: 0 }}
                  transition={{ type: "spring", stiffness: 220, damping: 22 }}
                  className="text-xl sm:text-3xl font-black absolute tabular-nums text-white"
                >
                  {block.value.toString().padStart(2, '0')}
                </motion.span>
              </AnimatePresence>
            </div>
            <span className="text-[9px] sm:text-[10px] text-white/55 mt-1.5 font-semibold uppercase tracking-[0.15em]">
              {block.label}
            </span>
          </div>
          {i < blocks.length - 1 && (
            <span className="text-white/25 text-lg sm:text-2xl font-light -mt-5 select-none">:</span>
          )}
        </div>
      ))}
    </div>
  );
}

// --- APP ---
export default function App() {
  const containerRef = useRef(null);
  const [activeDay, setActiveDay] = useState(1);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const currentDay = data.itinerary.find(d => d.day === activeDay)!;

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden" ref={containerRef}>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden flex flex-col"
        style={{ background: 'linear-gradient(145deg, #000A12 0%, #001525 45%, #000D1A 100%)' }}
      >
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 pt-16 sm:pt-20 pb-4 flex flex-col lg:flex-row items-center gap-6 lg:gap-10 min-h-[100svh] lg:min-h-0 lg:h-[680px]">

          {/* LEFT */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            className="flex-1 text-center lg:text-left space-y-5 z-10"
          >
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="text-cyan-400/75 text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em]">
              ✦ departure countdown ✦
            </motion.p>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
              className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tighter text-white leading-[0.92]">
              Bali<br />
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg, #0077B6, #00B4D8)' }}>
                Getaway.
              </span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
              className="text-slate-400 text-sm sm:text-base max-w-sm mx-auto lg:mx-0 leading-relaxed">
              Counting down to paradise. Here's the complete itinerary for our trip.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}>
              <Countdown targetDate={data.targetDate} />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
              {[{ icon: MapPin, text: 'Bali, Indonesia' }, { icon: CalendarDays, text: `${data.itinerary.length} Days` }].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 bg-white/8 border border-white/12 px-3 py-1.5 rounded-full backdrop-blur-sm">
                  <Icon className="w-3 h-3 text-cyan-400" />{text}
                </div>
              ))}
              <button
                onClick={() => setCalendarOpen(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300 bg-cyan-500/15 border border-cyan-400/30 px-3 py-1.5 rounded-full backdrop-blur-sm hover:bg-cyan-500/25 hover:border-cyan-400/50 transition-all"
              >
                <CalendarPlus className="w-3 h-3" />
                Add to Calendar
              </button>
            </motion.div>
          </motion.div>

          {/* RIGHT — Globe */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
            className="flex-1 w-full h-[320px] sm:h-[420px] lg:h-full"
          >
            <HeroMap />
          </motion.div>
        </div>

        {/* Wave */}
        <div className="relative z-20 translate-y-[1px]">
          <svg viewBox="0 0 1440 120" className="w-full h-auto fill-current" style={{ color: 'hsl(210, 17%, 98%)' }}>
            <path d="M0,60 C240,110 480,10 720,60 C960,110 1200,10 1440,60 L1440,120 L0,120 Z" />
          </svg>
        </div>
      </div>

      {/* ── PLAN ─────────────────────────────────────────────────────────── */}
      <main className="w-full max-w-2xl mx-auto px-4 sm:px-6 pt-14 sm:pt-20 pb-24">

        {/* Section header */}
        <div className="mb-10 sm:mb-12">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.22em] text-primary mb-2">Itinerary</p>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">The Plan — YMMA.</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-3 max-w-lg leading-relaxed">
            Heads up — <strong>this plan is lowkey flexible.</strong> Stuff happens, vibes shift, and we roll with it. No cap. But don't be that person who ghosts the group schedule and leaves everyone hanging. Read the room, manage your time, and let's keep it W for the whole squad. 🤙
          </p>
        </div>

        {/* Day tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-10 sm:mb-12">
          {data.itinerary.map((day) => {
            const isActive = day.day === activeDay;
            return (
              <button
                key={day.day}
                onClick={() => setActiveDay(day.day)}
                className={cn(
                  "text-left p-3 sm:p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer group",
                  isActive
                    ? "border-primary bg-primary shadow-lg shadow-primary/15"
                    : "border-border bg-card hover:border-primary/40 hover:shadow-sm"
                )}
              >
                <p className={cn("text-[10px] font-bold uppercase tracking-widest mb-1 truncate", isActive ? "text-white/60" : "text-muted-foreground")}>
                  Day {day.day} · {new Date(day.date).toLocaleDateString('en-US', { weekday: 'long' })}
                </p>
                <p className={cn("text-sm sm:text-base font-black leading-tight", isActive ? "text-white" : "text-foreground")}>
                  {day.date.split(',')[0]}
                </p>
                <p className={cn("text-[10px] sm:text-xs mt-1.5 font-semibold", isActive ? "text-white/55" : "text-muted-foreground")}>
                  {day.activities.length} stops
                </p>
              </button>
            );
          })}
        </div>

        {/* Activities timeline */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeDay}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
          >
            {currentDay.activities.map((activity, index) => {
              const cat = getCategory(activity.title, activity.description || '');
              const Icon = cat.icon;
              const isLast = index === currentDay.activities.length - 1;

              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.055, duration: 0.35, ease: "easeOut" }}
                  className="flex gap-4 sm:gap-5"
                >
                  {/* Icon + connector line */}
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                      cat.accent
                    )}>
                      <Icon className={cn("w-4 h-4 sm:w-[18px] sm:h-[18px]", cat.text)} />
                    </div>
                    {!isLast && (
                      <div className={cn("w-px flex-1 mt-2", cat.line)} style={{ minHeight: '1.5rem' }} />
                    )}
                  </div>

                  {/* Content */}
                  <div className={cn("flex-1", isLast ? "pb-0" : "pb-7 sm:pb-8")}>
                    <div className="flex items-start justify-between gap-3 -mt-0.5">
                      <div className="flex-1 min-w-0">
                        <span className={cn("text-[11px] font-bold tabular-nums", cat.text)}>
                          {activity.time}
                        </span>
                        <h3 className="font-bold text-[15px] sm:text-base leading-snug mt-0.5 text-foreground">
                          {activity.title}
                        </h3>
                        {activity.description && (
                          <p
                            className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-1.5"
                            dangerouslySetInnerHTML={{ __html: activity.description }}
                          />
                        )}
                      </div>
                      {activity.mapsUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className={cn(
                            "shrink-0 h-7 px-2.5 text-[11px] font-semibold rounded-lg cursor-pointer mt-0.5",
                            "text-muted-foreground hover:text-secondary hover:bg-secondary/8 border border-transparent hover:border-secondary/20 transition-all"
                          )}
                        >
                          <a href={activity.mapsUrl} target="_blank" rel="noopener noreferrer">
                            <MapPin className="mr-1 h-3 w-3" />
                            Maps
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <div className="mt-16 pt-10 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm font-bold text-foreground/75">Safe travels, see you in Bali 🌴</p>
          <p className="text-xs text-muted-foreground">June 12–14, 2026 · Kuta, Sanur, Ubud, Seminyak, Canggu</p>
        </div>
      </main>

      <AnimatePresence>
        {calendarOpen && <AddToCalendarModal onClose={() => setCalendarOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
