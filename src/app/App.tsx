import { useEffect, useState } from "react";
import { Calendar, MapPin, Clock, Search, Sparkles, Users, Music, Palette, MessageCircle, ExternalLink, Plus, X } from "lucide-react";

/* MARKER-MAKE-KIT-INVOKED */

const CATEGORIES = [
  { id: "alle", label: "Alle Events", color: "from-fuchsia-500 to-violet-600" },
  { id: "party", label: "Party", color: "from-pink-500 to-rose-600" },
  { id: "kultur", label: "Kultur", color: "from-amber-500 to-orange-600" },
  { id: "beratung", label: "Beratung", color: "from-emerald-500 to-teal-600" },
  { id: "community", label: "Community", color: "from-sky-500 to-blue-600" },
  { id: "demo", label: "Demo & Politik", color: "from-violet-500 to-purple-600" },
];

// EVENTS are now loaded from a Google Sheet (CSV export). See `useEffect` in `App`.

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  party: <Music size={13} />,
  kultur: <Palette size={13} />,
  beratung: <MessageCircle size={13} />,
  community: <Users size={13} />,
  demo: <Sparkles size={13} />,
};

const CATEGORY_COLORS: Record<string, string> = {
  party: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  kultur: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  beratung: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  community: "bg-sky-500/20 text-sky-300 border-sky-500/30",
  demo: "bg-violet-500/20 text-violet-300 border-violet-500/30",
};

function parseEventDates(dateStr: string): Date[] {
  if (!dateStr) return [];

  // Try to handle ranges (e.g., "28.-29.6.2026" or "28.6.-29.6.2026")
  const rangeMatch = dateStr.match(/(\d{1,2})\.(\d{1,2})?\.?-(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (rangeMatch) {
    const startDay = parseInt(rangeMatch[1]);
    const startMonth = rangeMatch[2] ? parseInt(rangeMatch[2]) : parseInt(rangeMatch[4]);
    const startYear = parseInt(rangeMatch[5]);
    const endDay = parseInt(rangeMatch[3]);
    const endMonth = parseInt(rangeMatch[4]);
    const endYear = parseInt(rangeMatch[5]);

    const start = new Date(startYear, startMonth - 1, startDay);
    const end = new Date(endYear, endMonth - 1, endDay);
    const dates: Date[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }
    return dates;
  }

  // Try to handle multiple dates separated by "+" or ","
  const parts = dateStr.split(/[,+]+/).map(s => s.trim()).filter(Boolean);
  const dates: Date[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    // Try German format: "28.6.2026" or "28.06.2026"
    let dmy = part.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (dmy) {
      const d = parseInt(dmy[1]);
      const m = parseInt(dmy[2]);
      const y = parseInt(dmy[3]);
      dates.push(new Date(y, m - 1, d));
      continue;
    }

    // Try abbreviated format: "28." (day only) — use month/year from next part
    const abbrev = part.match(/^(\d{1,2})\.?$/);
    if (abbrev && i + 1 < parts.length) {
      const nextPart = parts[i + 1];
      const nextDmy = nextPart.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
      if (nextDmy) {
        const d = parseInt(abbrev[1]);
        const m = parseInt(nextDmy[2]);
        const y = parseInt(nextDmy[3]);
        dates.push(new Date(y, m - 1, d));
        continue;
      }
    }

    // Try ISO format: "2026-06-28"
    const iso = part.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) {
      const y = parseInt(iso[1]);
      const m = parseInt(iso[2]);
      const d = parseInt(iso[3]);
      dates.push(new Date(y, m - 1, d));
      continue;
    }
  }

  return dates;
}

function normalizeCategory(rawCat: string): string {
  if (!rawCat) return 'alle';
  
  const lower = rawCat.toLowerCase().trim();
  
  // Check if it matches any CATEGORIES id (exact match, case-insensitive)
  const matchById = CATEGORIES.find(c => c.id === lower);
  if (matchById) return matchById.id;
  
  // Check if it matches any CATEGORIES label (case-insensitive)
  const matchByLabel = CATEGORIES.find(c => c.label.toLowerCase() === lower);
  if (matchByLabel) return matchByLabel.id;
  
  // Return original lowercase if no match
  return lower;
}

function getEventMinDate(dateStr: string): Date {
  const dates = parseEventDates(dateStr);
  return dates.length > 0 ? dates[0] : new Date(9999, 0, 1);
}

function formatDate(dateStr: string) {
  const dates = parseEventDates(dateStr);
  if (dates.length === 0) return dateStr;

  if (dates.length === 1) {
    return dates[0].toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
  }

  // Multiple dates: format as "Fr., 28. August + Sa., 29. August 2026"
  const formatted = dates.map((d, i) => {
    const opts = { weekday: "short", day: "numeric", month: "long", year: i === dates.length - 1 ? "numeric" : undefined };
    return d.toLocaleDateString("de-DE", opts as Intl.DateTimeFormatOptions);
  }).join(" + ");
  return formatted;
}

type Event = {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  category: string;
  description: string;
  tags: string[];
  link: string;
  emoji: string;
};

function parseCsvToEvents(csv: string): Event[] {
  // Robust CSV parser that supports quoted fields with commas/newlines
  const rows: string[][] = [];
  let cur = "";
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];
    const next = csv[i + 1];
    if (ch === '"') {
      if (inQuotes && next === '"') {
        cur += '"';
        i++;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }

    if (ch === ',' && !inQuotes) {
      row.push(cur);
      cur = '';
      continue;
    }

    if ((ch === '\n' || ch === '\r') && !inQuotes) {
      // handle CRLF
      if (ch === '\r' && next === '\n') i++;
      row.push(cur);
      rows.push(row);
      row = [];
      cur = '';
      continue;
    }

    cur += ch;
  }
  // push remaining
  if (cur !== '' || row.length > 0) {
    row.push(cur);
    rows.push(row);
  }

  if (rows.length === 0) return [];

  const headers = rows.shift()!.map(h => h.trim().toLowerCase());

  function normalizeDate(s: string) {
    if (!s) return '';
    s = s.trim();
    const dmy = s.match(/^(\d{1,2})[\.\-/](\d{1,2})[\.\-/](\d{4})$/);
    if (dmy) {
      const d = dmy[1].padStart(2, '0');
      const m = dmy[2].padStart(2, '0');
      const y = dmy[3];
      return `${y}-${m}-${d}`;
    }
    // already yyyy-mm-dd
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    return s;
  }

  function normalizeTime(s: string) {
    if (!s) return '';
    return s.trim().replace('.', ':');
  }

  return rows.map((r, idx) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = (r[i] || '').trim();
    });

    const tagsRaw = obj['tags'] || obj['tag'] || obj['stichworte'] || '';
    const tags = tagsRaw
      ? tagsRaw.split(/[;,\n]+/).map(s => s.trim()).filter(Boolean)
      : [];

    return {
      id: Number(obj['id'] || obj['nummer'] || idx + 1),
      title: obj['title'] || obj['titel'] || '',
      date: normalizeDate(obj['date'] || obj['datum'] || ''),
      time: normalizeTime(obj['time'] || obj['uhrzeit'] || ''),
      location: obj['location'] || obj['ort'] || '',
      category: normalizeCategory(obj['category'] || obj['kategorie'] || ''),
      description: obj['description'] || obj['beschreibung'] || '',
      tags,
      link: obj['link'] || obj['url'] || '',
      emoji: obj['emoji'] || '',
    } as Event;
  });
}

function EventCard({ event }: { event: Event }) {
  const catColor = CATEGORY_COLORS[event.category] ?? "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30";
  const catLabel = CATEGORIES.find(c => c.id === event.category)?.label ?? event.category;

  return (
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-card hover:border-white/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-fuchsia-900/20">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-2 mb-2.5">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${catColor}`}>
                {CATEGORY_ICONS[event.category]}
                {catLabel}
              </span>
            </div>
            <h3 className="leading-snug text-card-foreground" style={{ fontSize: "0.975rem", fontWeight: 700 }}>
              {event.title}
            </h3>
          </div>
          <span className="text-3xl shrink-0 mt-0.5">{event.emoji}</span>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed mb-4">{event.description}</p>

        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar size={13} className="shrink-0 text-fuchsia-400" />
            <span>{formatDate(event.date)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock size={13} className="shrink-0 text-fuchsia-400" />
            <span>{event.time} Uhr</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin size={13} className="shrink-0 text-fuchsia-400" />
            <span className="truncate">{event.location}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {event.tags.map(tag => (
            <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-secondary text-muted-foreground border border-white/5">
              #{tag}
            </span>
          ))}
        </div>

        {event.link && (
          <div className="pt-3 border-t border-white/5">
            <a
              href={event.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-fuchsia-400 hover:text-fuchsia-300 transition-colors"
            >
              <ExternalLink size={12} />
              Zur Veranstaltungsseite
            </a>
          </div>
        )}
      </div>
    </article>
  );
}

export default function App() {
  const [activeCategory, setActiveCategory] = useState("alle");
  const [search, setSearch] = useState("");
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Public sheet CSV export (change SHEET_ID/GID if needed)
    const SHEET_ID = "15Jw7Nn1Bo3raRXQz5vm2iuPdh-FgFBoMtUveJX6Q2NA";
    const GID = "0";
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;

    setLoading(true);
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        return res.text();
      })
      .then(csv => setEvents(parseCsvToEvents(csv)))
      .catch(err => {
        console.error(err);
        setError(String(err));
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = events
    .filter(e => {
      const matchCat = activeCategory === "alle" || e.category === activeCategory;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        e.title.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q) ||
        e.tags.some(t => t.toLowerCase().includes(q));
      return matchCat && matchSearch;
    })
    .filter(e => {
      // Exclude past events (before today)
      const eventMinDate = getEventMinDate(e.date);
      const today = new Date("2026-06-16T00:00:00");
      today.setHours(0, 0, 0, 0);
      return eventMinDate >= today;
    })
    .sort((a, b) => {
      // Sort by earliest date in the event (closest first)
      const dateA = getEventMinDate(a.date);
      const dateB = getEventMinDate(b.date);
      return dateA.getTime() - dateB.getTime();
    });

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-xl border-b border-white/5">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-base"
                  style={{ background: "linear-gradient(135deg, #f97316, #eab308, #22c55e, #3b82f6, #8b5cf6, #ec4899)" }}
                >
                  🏳️‍🌈
                </div>
                <h1 style={{ fontSize: "1.2rem", fontWeight: 800, background: "linear-gradient(90deg, #f472b6, #c084fc, #60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Queer in Aachen
                </h1>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 ml-0.5">Events · Community · Sichtbarkeit</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Events suchen…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-secondary border border-white/10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-fuchsia-500/50 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Suche löschen">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Category pills */}
        <div className="px-4 pb-3 overflow-x-auto" style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}>
          <div className="flex gap-2 w-max">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-sm whitespace-nowrap transition-all font-semibold border ${
                  activeCategory === cat.id
                    ? `bg-gradient-to-r ${cat.color} text-white border-transparent shadow-md`
                    : "bg-secondary border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Hero */}
      <div
        className="px-5 py-7 text-center relative overflow-hidden"
        style={{ background: "linear-gradient(180deg, #1a0d2e 0%, #0f0b1a 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 25% 60%, #c026d3 0%, transparent 55%), radial-gradient(ellipse at 75% 40%, #7c3aed 0%, transparent 55%)" }}
        />
        <div className="relative z-10">
          <div className="flex justify-center gap-1 mb-2">
            {"🔴🟠🟡🟢🔵🟣".split("").filter((_, i) => i % 2 === 0).map((c, i) => (
              <span key={i} className="text-lg">{c}</span>
            ))}
          </div>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed">
            Dein Guide für queere Veranstaltungen, Community-Treffpunkte und LGBTQ+ Leben in Aachen.
          </p>
        </div>
      </div>

      {/* Result count */}
      <div className="px-4 py-3 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="text-foreground font-semibold">{filtered.length}</span>{" "}
          {filtered.length === 1 ? "Event" : "Events"} gefunden
        </p>
        {(activeCategory !== "alle" || search) && (
          <button
            onClick={() => { setActiveCategory("alle"); setSearch(""); }}
            className="text-xs text-fuchsia-400 hover:text-fuchsia-300 flex items-center gap-1 transition-colors"
          >
            <X size={11} /> Zurücksetzen
          </button>
        )}
      </div>

      {/* Events */}
      <main className="px-4 pb-32 space-y-4">
        {loading ? (
          <div className="text-center py-16 text-muted-foreground">Lädt…</div>
        ) : error ? (
          <div className="text-center py-16 text-red-400">Fehler beim Laden der Events</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-foreground font-bold mb-1" style={{ fontSize: "1rem" }}>Keine Events gefunden</p>
            <p className="text-sm">Versuche einen anderen Begriff oder eine andere Kategorie.</p>
          </div>
        ) : (
          filtered.map(event => <EventCard key={event.id} event={event} />)
        )}

      </main>

      {/* Bottom bar – Event vorschlagen */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-card/90 backdrop-blur-xl border-t border-white/10">
        <div className="px-4 py-3">
          <button
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 active:opacity-75"
            style={{ background: "linear-gradient(135deg, #c026d3, #7c3aed)" }}
          >
            <Plus size={16} />
            Event vorschlagen
          </button>
        </div>
      </nav>
    </div>
  );
}
