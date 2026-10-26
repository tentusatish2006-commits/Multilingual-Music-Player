import { useEffect, useRef, useState, type FormEvent, type PointerEvent, type ReactNode } from 'react';
import { Link, Route, Switch, useLocation } from 'wouter';
import {
  Activity, ArrowLeft, ArrowRight, AudioLines, Bookmark, Check,
  Disc3, Globe2, Headphones, Heart, Library, Music2,
  Pause, Play, Radio, RotateCcw, Search, Sparkles, Volume2,
  X,
} from 'lucide-react';

type Track = {
  id: string;
  title: string;
  artist: string;
  album: string;
  artworkUrl: string;
  previewUrl: string | null;
  durationMs: number;
  releaseDate?: string;
  genre: string;
};

type SavedData = { saved: Track[]; recent: Track[] };
type Country = { label: string; code: string; language: string; search: string };

const COUNTRIES: Country[] = [
  { label: 'United States', code: 'us', language: 'English', search: 'pop hits' },
  { label: 'Japan', code: 'jp', language: 'Japanese', search: 'J-pop' },
  { label: 'South Korea', code: 'kr', language: 'Korean', search: 'K-pop' },
  { label: 'Brazil', code: 'br', language: 'Portuguese', search: 'Brazilian pop' },
  { label: 'Mexico', code: 'mx', language: 'Spanish', search: 'Latin pop' },
  { label: 'France', code: 'fr', language: 'French', search: 'French pop' },
  { label: 'United Kingdom', code: 'gb', language: 'English', search: 'UK hits' },
  { label: 'India', code: 'in', language: 'Hindi', search: 'Hindi songs' },
  { label: 'Nigeria', code: 'ng', language: 'Afrobeats', search: 'Afrobeats' },
  { label: 'Italy', code: 'it', language: 'Italian', search: 'Italian pop' },
  { label: 'Germany', code: 'de', language: 'German', search: 'German pop' },
  { label: 'Australia', code: 'au', language: 'English', search: 'Australian music' },
];

const LANGUAGES = [
  { name: 'Korean', note: 'Seoul to everywhere', term: 'K-pop' },
  { name: 'Japanese', note: 'New sounds from Japan', term: 'J-pop' },
  { name: 'Spanish', note: 'The Latin pulse', term: 'Latin pop' },
  { name: 'Portuguese', note: 'Brazil on repeat', term: 'Brazilian pop' },
  { name: 'Hindi', note: 'A whole new rhythm', term: 'Hindi songs' },
  { name: 'Tamil', note: 'Tamil sounds, worldwide', term: 'Tamil songs' },
  { name: 'Telugu', note: 'Fresh Telugu releases', term: 'Telugu songs' },
  { name: 'Malayalam', note: 'Sounds from Kerala', term: 'Malayalam songs' },
  { name: 'Kannada', note: 'Discover Kannada music', term: 'Kannada songs' },
  { name: 'Bengali', note: 'New Bengali favorites', term: 'Bengali songs' },
  { name: 'Punjabi', note: 'Punjabi pop and bhangra', term: 'Punjabi songs' },
  { name: 'Arabic', note: 'Across the Arab world', term: 'Arabic pop' },
  { name: 'Mandarin', note: 'Mandopop discoveries', term: 'Mandopop' },
  { name: 'Indonesian', note: 'Pop from Indonesia', term: 'Indonesian pop' },
  { name: 'Thai', note: 'New sounds from Thailand', term: 'Thai pop' },
  { name: 'Vietnamese', note: 'V-pop discoveries', term: 'Vietnamese pop' },
  { name: 'Turkish', note: 'Pop from Türkiye', term: 'Turkish pop' },
  { name: 'Russian', note: 'Sounds from across Russia', term: 'Russian pop' },
  { name: 'Filipino', note: 'OPM and new releases', term: 'Filipino pop' },
  { name: 'Dutch', note: 'New music from the Netherlands', term: 'Dutch pop' },
  { name: 'Polish', note: 'Fresh sounds from Poland', term: 'Polish pop' },
  { name: 'Afrobeats', note: 'West African energy', term: 'Afrobeats' },
  { name: 'French', note: 'French pop discoveries', term: 'French pop' },
  { name: 'Italian', note: 'New music from Italy', term: 'Italian pop' },
  { name: 'German', note: 'Fresh German releases', term: 'German pop' },
  { name: 'English', note: 'The latest in English', term: 'English pop' },
];

const LANGUAGE_COUNTRIES: Record<string, string> = {
  Korean: 'kr', Japanese: 'jp', Spanish: 'mx', Portuguese: 'br',
  Hindi: 'in', Tamil: 'in', Telugu: 'in', Malayalam: 'in',
  Kannada: 'in', Bengali: 'in', Punjabi: 'in', Arabic: 'ae',
  Mandarin: 'tw', Indonesian: 'id', Thai: 'th', Vietnamese: 'vn',
  Turkish: 'tr', Russian: 'ru', Filipino: 'ph', Dutch: 'nl',
  Polish: 'pl', Afrobeats: 'ng', French: 'fr', Italian: 'it',
  German: 'de', English: 'us',
};

const STORAGE_KEY = 'aurora-listening-library-v1';

function readLibrary(): SavedData {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as Partial<SavedData>;
    return { saved: Array.isArray(parsed.saved) ? parsed.saved : [], recent: Array.isArray(parsed.recent) ? parsed.recent : [] };
  } catch {
    return { saved: [], recent: [] };
  }
}

function formatTime(ms: number) {
  if (!ms) return '—';
  const seconds = Math.floor(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function usePointerTilt() {
  const [style, setStyle] = useState<Record<string, string>>({});
  const onMove = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'touch') return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - .5;
    const y = (event.clientY - bounds.top) / bounds.height - .5;
    setStyle({ transform: `perspective(1100px) rotateY(${x * 3.5}deg) rotateX(${-y * 3.5}deg)` });
  };
  const onLeave = () => setStyle({ transform: 'perspective(1100px) rotateY(0deg) rotateX(0deg)' });
  return { style, onMove, onLeave };
}

function App() {
  const [location, navigate] = useLocation();
  const [library, setLibrary] = useState<SavedData>(readLibrary);
  const [playingTrack, setPlayingTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.78);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(library)); }, [library]);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    if (playingTrack?.previewUrl) {
      audio.src = playingTrack.previewUrl;
      if (isPlaying) void audio.play().catch(() => setIsPlaying(false));
      else audio.pause();
    } else {
      audio.pause();
      audio.removeAttribute('src');
    }
  }, [playingTrack, isPlaying, volume]);

  const playTrack = (track: Track) => {
    if (!track.previewUrl) return;
    setPlayingTrack(track);
    setIsPlaying(true);
    setLibrary(current => ({ ...current, recent: [track, ...current.recent.filter(t => t.id !== track.id)].slice(0, 40) }));
  };
  const toggleSave = (track: Track) => {
    setLibrary(current => ({
      ...current,
      saved: current.saved.some(t => t.id === track.id) ? current.saved.filter(t => t.id !== track.id) : [track, ...current.saved],
    }));
  };
  const navItems = [
    { href: '/', label: 'Discover', icon: Sparkles },
    { href: '/search', label: 'Search', icon: Search },
    { href: '/library', label: 'Your library', icon: Library },
  ];

  return (
    <div className="app-shell">
      <div className="ambient" aria-hidden="true" />
      <div className="app-layout">
        <aside className="sidebar" aria-label="Main navigation">
          <Link href="/" className="brand"><span className="brand-mark"><AudioLines size={19} /></span><span>Aurora</span></Link>
          <div className="nav-caption">Your space</div>
          <nav className="nav-list">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className={`nav-link ${location === href ? 'active' : ''}`} data-testid={`link-${label.toLowerCase().replaceAll(' ', '-')}`}>
                <Icon size={17} strokeWidth={1.8} /><span>{label}</span>
              </Link>
            ))}
          </nav>
          <div className="side-bottom"><strong>A wider world, one song at a time.</strong>Independent discovery, with previews from Apple Music.</div>
        </aside>

        <main className="main-content">
          <header className="topbar">
            <div className="top-links">
              <Link href="/" className="top-link">Discover</Link>
              <Link href="/search" className="top-link">Browse all</Link>
            </div>
            <div className="top-meta"><span className="live-dot" /> LIVE CHARTS · REGIONAL EDITIONS</div>
          </header>
          <Switch>
            <Route path="/">
              <DiscoverPage playTrack={playTrack} saved={library.saved} toggleSave={toggleSave} />
            </Route>
            <Route path="/search">
              <SearchPage playTrack={playTrack} saved={library.saved} toggleSave={toggleSave} />
            </Route>
            <Route path="/library">
              <LibraryPage library={library} playTrack={playTrack} toggleSave={toggleSave} />
            </Route>
            <Route>
              <NotFound onHome={() => navigate('/')} />
            </Route>
          </Switch>
        </main>
      </div>
      <Player track={playingTrack} playing={isPlaying} setPlaying={setIsPlaying} volume={volume} setVolume={setVolume} audioRef={audioRef} />
    </div>
  );
}

function DiscoverPage({ playTrack, saved, toggleSave }: { playTrack: (t: Track) => void; saved: Track[]; toggleSave: (t: Track) => void }) {
  const [, navigate] = useLocation();
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const tilt = usePointerTilt();

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setTracks([]);
    fetch(`/api/music/charts?country=${encodeURIComponent(country.code)}`, { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('The chart is temporarily unavailable.'); return response.json(); })
      .then(data => {
        if (!Array.isArray(data)) throw new Error('No chart data was returned for this region.');
        setTracks(data as Track[]);
        setLoading(false);
      })
      .catch(reason => { if (reason.name !== 'AbortError') { setError(reason.message || 'Could not connect to the charts.'); setLoading(false); } });
    return () => controller.abort();
  }, [country]);

  const chooseLanguage = (term: string) => navigate(`/search?term=${encodeURIComponent(term)}`);

  return <>
    <section className="hero" style={tilt.style} onPointerMove={tilt.onMove} onPointerLeave={tilt.onLeave} aria-label="Aurora music discovery">
      <div className="hero-copy">
        <div className="eyebrow">A frequency beyond familiar</div>
        <h1>Hear the<br /><span>elsewhere.</span></h1>
        <p>New favorites don’t have borders. Follow the sound into the charts, languages, and scenes moving right now.</p>
        <Link href="/search" className="hero-button" data-testid="link-explore-songs"><Play size={14} fill="currentColor" /> Find your next song <ArrowRight size={14} /></Link>
      </div>
      <div className="hero-visual" aria-hidden="true"><div className="orbit" /><div className="orbit" /><div className="orbit" /><div className="orb-core" /></div>
    </section>

    <section className="section">
      <div className="section-head"><div><div className="section-kicker">Sound in motion</div><h2>Regional charts</h2><p>Apple Music’s most-played tracks, by country.</p></div><span className="top-meta"><Activity size={13} /> UPDATED BY APPLE</span></div>
      <div className="chart-toolbar">
        <label className="top-meta" htmlFor="country-select"><Globe2 size={14} /> LISTENING IN</label>
        <select id="country-select" className="country-select" value={country.code} onChange={e => setCountry(COUNTRIES.find(c => c.code === e.target.value) ?? COUNTRIES[0])} data-testid="select-chart-country">
          {COUNTRIES.map(item => <option key={item.code} value={item.code}>{item.label} · {item.language}</option>)}
        </select>
      </div>
      {loading ? <LoadingGrid /> : error ? <ErrorState message={error} retry={() => setCountry({ ...country })} /> : tracks.length ? <TrackGrid tracks={tracks.slice(0, 10)} playTrack={playTrack} saved={saved} toggleSave={toggleSave} /> : <EmptyState title="No chart tracks yet" message="There are no chart results for this region right now." />}
      {!loading && !error && tracks.length > 0 && <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}><Link href="/search" className="text-button">Search the full catalog <ArrowRight size={13} /></Link></div>}
    </section>

    <section className="section">
      <div className="section-head"><div><div className="section-kicker">Choose a direction</div><h2>Find a new frequency</h2><p>Search Apple’s catalog for sounds in another language.</p></div><Link href="/search" className="text-button">All languages <ArrowRight size={13} /></Link></div>
      <div className="language-grid">
        {LANGUAGES.map((language, i) => <button className="language-tile" key={language.name} onClick={() => chooseLanguage(language.term)} data-testid={`button-language-${language.name.toLowerCase()}`}><strong>{language.name}</strong><span>{language.note}</span></button>)}
      </div>
    </section>
    <p className="notice" style={{ marginTop: 38 }}>Aurora links to regional chart listings and short Apple Music previews. Availability varies by country.</p>
  </>;
}

function SearchPage({ playTrack, saved, toggleSave }: { playTrack: (t: Track) => void; saved: Track[]; toggleSave: (t: Track) => void }) {
  const [location] = useLocation();
  const initialTerm = new URLSearchParams(window.location.search).get('term') || '';
  const [term, setTerm] = useState(initialTerm);
  const [language, setLanguage] = useState('');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const searchController = useRef<AbortController | null>(null);

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get('term');
    if (value && value !== term) setTerm(value);
    // Keep this synchronized for language shortcut navigation.
  }, [location]);

  const search = (event?: FormEvent) => {
    event?.preventDefault();
    const query = [term.trim(), language].filter(Boolean).join(' ');
    if (!query) { setTracks([]); setSearched(false); return; }
    searchController.current?.abort();
    const controller = new AbortController();
    searchController.current = controller;
    setLoading(true); setError(''); setSearched(true);
    const selectedLanguage = language || LANGUAGES.find(
      item => item.term.toLowerCase() === term.trim().toLowerCase(),
    )?.name || '';
    const country = LANGUAGE_COUNTRIES[selectedLanguage] ?? 'us';
    fetch(`/api/music/search?term=${encodeURIComponent(query)}&country=${country}&limit=30`, { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('Search is unavailable right now. Try again in a moment.'); return response.json(); })
      .then(data => { setTracks(Array.isArray(data) ? data as Track[] : []); setLoading(false); })
      .catch(reason => { if (reason.name !== 'AbortError') { setError(reason.message || 'Could not connect to Apple’s catalog.'); setLoading(false); } });
  };

  return <>
    <div className="section-kicker">The world is in the search bar</div>
    <h1 className="page-title">Find your next<br />favorite sound.</h1>
    <p className="page-intro">Search Apple’s music catalog by artist, song, or scene. Choose a language to make the discovery more specific.</p>
    <form className="search-panel" onSubmit={search}>
      <div className="search-field"><Search size={17} className="search-icon" /><input className="search-input" value={term} onChange={e => setTerm(e.target.value)} placeholder="Try a song, artist, or genre" aria-label="Search songs and artists" data-testid="input-search" /></div>
      <select className="filter-select" value={language} onChange={e => setLanguage(e.target.value)} aria-label="Filter by language" data-testid="select-language-filter">
        <option value="">Any language</option>
        {LANGUAGES.map(item => <option key={item.name} value={item.name}>{item.name}</option>)}
      </select>
      <button className="button-primary" type="submit" data-testid="button-search"><Search size={14} /> Search</button>
    </form>
    <p className="notice">Search results and preview availability reflect Apple’s catalog in your region.</p>
    <div className="search-results-head">{searched ? `${tracks.length} SONGS FOUND` : 'READY WHEN YOU ARE'}</div>
    {loading ? <LoadingGrid /> : error ? <ErrorState message={error} retry={() => search()} /> : searched && tracks.length ? <TrackGrid tracks={tracks} playTrack={playTrack} saved={saved} toggleSave={toggleSave} /> : searched ? <EmptyState title="Nothing in this frequency" message="Try a different spelling, artist, or language filter." action={<button className="text-button" onClick={() => { setTerm(''); setLanguage(''); setSearched(false); }}>Clear search <X size={13} /></button>} /> : <div className="empty-state"><div className="empty-icon"><Globe2 size={20} /></div><h3>Somewhere new is one search away</h3><p>Search a phrase above, or jump into a region to begin.</p><div className="language-grid" style={{ width: '100%', maxWidth: 600, marginTop: 14 }}>{LANGUAGES.slice(0, 4).map(item => <button key={item.name} className="language-tile" onClick={() => { setTerm(item.term); setLanguage(''); setTimeout(() => { const input = document.querySelector<HTMLInputElement>('[data-testid="input-search"]'); input?.focus(); }, 0); }}><strong>{item.name}</strong><span>{item.note}</span></button>)}</div></div>}
  </>;
}

function LibraryPage({ library, playTrack, toggleSave }: { library: SavedData; playTrack: (t: Track) => void; toggleSave: (t: Track) => void }) {
  const [tab, setTab] = useState<'saved' | 'recent'>('saved');
  const tracks = tab === 'saved' ? library.saved : library.recent;
  return <>
    <div className="section-kicker">Your listening, held close</div>
    <h1 className="page-title">A place for<br />what stays.</h1>
    <p className="page-intro">Saved songs and recent spins live on this device. Your collection stays yours.</p>
    <div className="tabs" role="tablist" aria-label="Library views">
      <button className={`tab ${tab === 'saved' ? 'active' : ''}`} role="tab" aria-selected={tab === 'saved'} onClick={() => setTab('saved')} data-testid="tab-saved"><Bookmark size={13} style={{ verticalAlign: 'middle', marginRight: 6 }} />Saved tracks <span>({library.saved.length})</span></button>
      <button className={`tab ${tab === 'recent' ? 'active' : ''}`} role="tab" aria-selected={tab === 'recent'} onClick={() => setTab('recent')} data-testid="tab-recent"><Activity size={13} style={{ verticalAlign: 'middle', marginRight: 6 }} />Recently played <span>({library.recent.length})</span></button>
    </div>
    {tracks.length ? <TrackGrid tracks={tracks} playTrack={playTrack} saved={library.saved} toggleSave={toggleSave} /> : <EmptyState title={tab === 'saved' ? 'Keep a song close' : 'Your first listen is waiting'} message={tab === 'saved' ? 'Save tracks as you discover them and they’ll find a home here.' : 'Play a preview and your recent listening will appear here.'} action={<Link href="/search" className="text-button">Explore songs <ArrowRight size={13} /></Link>} />}
    <p className="notice" style={{ marginTop: 24 }}>Stored only in this browser. Clearing site data removes your library.</p>
  </>;
}

function TrackGrid({ tracks, playTrack, saved, toggleSave }: { tracks: Track[]; playTrack: (t: Track) => void; saved: Track[]; toggleSave: (t: Track) => void }) {
  return <div className="track-grid">
    {tracks.map((track, index) => {
      const isSaved = saved.some(item => item.id === track.id);
      return <article className="track-card" key={`${track.id}-${index}`} data-testid={`card-track-${track.id}`}>
        <div className="artwork">
          {track.artworkUrl ? <img src={track.artworkUrl} alt={`${track.album} artwork`} loading="lazy" /> : <div className="art-fallback"><Disc3 size={35} /></div>}
          <button className={`save-button ${isSaved ? 'saved' : ''}`} onClick={() => toggleSave(track)} aria-label={isSaved ? `Remove ${track.title} from saved tracks` : `Save ${track.title}`} title={isSaved ? 'Remove from saved' : 'Save track'} data-testid={`button-save-${track.id}`}>{isSaved ? <Check size={14} /> : <Heart size={14} />}</button>
          <button className="art-play" onClick={() => playTrack(track)} disabled={!track.previewUrl} aria-label={track.previewUrl ? `Play preview of ${track.title}` : `${track.title} preview unavailable`} title={track.previewUrl ? 'Play preview' : 'Preview unavailable in this regional chart'} data-testid={`button-play-${track.id}`}><Play size={15} fill="currentColor" /></button>
        </div>
        <div className="track-info"><div className="track-title" title={track.title}>{track.title}</div><div className="track-artist" title={track.artist}>{track.artist}</div><div className="track-meta"><span>{track.genre}</span><span>{formatTime(track.durationMs)}</span></div></div>
      </article>;
    })}
  </div>;
}

function LoadingGrid() {
  return <div className="loading-state" role="status" aria-label="Loading songs">{Array.from({ length: 5 }, (_, i) => <div className="skeleton" key={i} />)}</div>;
}

function EmptyState({ title, message, action }: { title: string; message: string; action?: ReactNode }) {
  return <div className="empty-state"><div className="empty-icon"><Music2 size={20} /></div><h3>{title}</h3><p>{message}</p>{action}</div>;
}

function ErrorState({ message, retry }: { message: string; retry: () => void }) {
  return <div className="error-state" role="alert"><div className="empty-icon"><Radio size={20} /></div><h3>Signal dropped</h3><p>{message} Check your connection and try again.</p><button className="text-button" onClick={retry} data-testid="button-retry"><RotateCcw size={13} /> Try again</button></div>;
}

function Player({ track, playing, setPlaying, volume, setVolume, audioRef }: { track: Track | null; playing: boolean; setPlaying: (v: boolean) => void; volume: number; setVolume: (v: number) => void; audioRef: { current: HTMLAudioElement | null } }) {
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [muted, setMuted] = useState(false);
  useEffect(() => { setCurrent(0); setDuration(track?.durationMs ? track.durationMs / 1000 : 30); }, [track]);
  return <>
    <audio ref={audioRef} onTimeUpdate={event => setCurrent(event.currentTarget.currentTime)} onLoadedMetadata={event => setDuration(event.currentTarget.duration)} onEnded={() => setPlaying(false)} />
    <footer className="player" aria-label="Music preview player">
      <div className="player-track">
        {track?.artworkUrl ? <img className="player-cover" src={track.artworkUrl} alt="" /> : <div className="player-cover art-fallback"><Disc3 size={19} /></div>}
        <div className="player-track-text">{track ? <><strong>{track.title}</strong><span>{track.artist}</span></> : <><strong>Choose a frequency</strong><span>Apple Music preview player</span></>}</div>
      </div>
      <div className="player-main">
        <div className="player-controls">
          <button className="play-main" onClick={() => setPlaying(!playing)} disabled={!track?.previewUrl} aria-label={playing ? 'Pause preview' : 'Play preview'} data-testid="button-player-toggle">{playing ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}</button>
        </div>
        <div className="progress-row"><span>{formatTime(current * 1000)}</span><input className="progress-range" type="range" min="0" max={duration || 30} step=".1" value={Math.min(current, duration || 30)} aria-label="Preview position" onChange={e => { if (audioRef.current) audioRef.current.currentTime = Number(e.target.value); }} /><span>{formatTime(duration * 1000)}</span></div>
      </div>
      <div className="player-volume"><button className="icon-button" aria-label={muted ? 'Unmute' : 'Mute'} onClick={() => { setMuted(!muted); if (audioRef.current) audioRef.current.muted = !muted; }}><Volume2 size={16} /></button><input type="range" min="0" max="1" step=".01" value={volume} aria-label="Volume" onChange={e => setVolume(Number(e.target.value))} /></div>
    </footer>
  </>;
}

function NotFound({ onHome }: { onHome: () => void }) {
  return <div className="empty-state" style={{ marginTop: 70 }}><div className="empty-icon"><Headphones size={20} /></div><h3>This track isn’t on the map</h3><p>That page drifted out of range. Let’s tune back in.</p><button className="button-primary" onClick={onHome}><ArrowLeft size={14} /> Back to discovery</button></div>;
}

export default App;
