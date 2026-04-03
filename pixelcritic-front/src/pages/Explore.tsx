import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Filter, Star, ChevronDown, ChevronLeft, ChevronRight, Gamepad2, Monitor, Gamepad, Smartphone, Plus, Check, X, Layers } from 'lucide-react';
import * as Slider from '@radix-ui/react-slider';
import GameCard, { getPlatformIcon } from '../components/GameCard';
import { useAuth } from '../context/UserContext';
import { getGames } from '../services/gameService';
import { addToLibrary, getLibrary, removeFromLibraryByGameId } from '../services/libraryService';

const COLLECTIONS = ["Newly Released", "Trending Games"];
const GAMES_PER_PAGE = 24;
const SORT_OPTIONS = [
  "Highest Score",
  "Lowest Score",
  "Release Date (Newest to Oldest)",
  "Release Date (Oldest to Newest)",
  "Alphabetical (A-Z)"
];

export default function Explore() {
  const { isLoggedIn, user } = useAuth();
  const [allGames, setAllGames] = useState<any[]>([]);
  const [isLoadingGames, setIsLoadingGames] = useState(true);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedDevelopers, setSelectedDevelopers] = useState<string[]>([]);
  const [selectedPublishers, setSelectedPublishers] = useState<string[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  
  const [isGenresOpen, setIsGenresOpen] = useState(true);
  const [isThemesOpen, setIsThemesOpen] = useState(false);
  const [isPlatformsOpen, setIsPlatformsOpen] = useState(true);
  const [isDevelopersOpen, setIsDevelopersOpen] = useState(false);
  const [isPublishersOpen, setIsPublishersOpen] = useState(false);
  const [isCollectionsOpen, setIsCollectionsOpen] = useState(true);
  const [developerSearch, setDeveloperSearch] = useState('');
  const [publisherSearch, setPublisherSearch] = useState('');

  const [searchParams] = useSearchParams();

  useEffect(() => {
    const collectionParam = searchParams.get('collection');
    if (collectionParam === 'newly-released') {
      setSelectedCollections(prev => prev.includes('Newly Released') ? prev : [...prev, 'Newly Released']);
      setSortBy('Release Date (Newest to Oldest)');
    } else if (collectionParam === 'trending') {
      setSelectedCollections(prev => prev.includes('Trending Games') ? prev : [...prev, 'Trending Games']);
    }
  }, [searchParams]);

  // Fetch all games from API
  useEffect(() => {
    const fetchAllGames = async () => {
      setIsLoadingGames(true);
      try {
        const result = await getGames({ limit: 500 });
        setAllGames(result.data);
      } catch (err) {
        console.error('Failed to fetch games:', err);
      } finally {
        setIsLoadingGames(false);
      }
    };
    fetchAllGames();
  }, []);

  // Fetch user's library to populate addedGames on mount
  useEffect(() => {
    if (!isLoggedIn || !user) return;
    const fetchLibrary = async () => {
      try {
        const entries = await getLibrary(user._id);
        const map: Record<string, string> = {};
        entries.forEach((entry: any) => {
          if (entry.game?._id) map[entry.game._id] = entry.status;
        });
        setAddedGames(map);
      } catch (err) {
        console.error('Failed to fetch library:', err);
      }
    };
    fetchLibrary();
  }, [isLoggedIn, user]);

  // Dynamically extract filter options from loaded games
  const GENRES = useMemo(() => {
    const set = new Set<string>();
    allGames.forEach(g => g.genres?.forEach((genre: string) => set.add(genre)));
    return Array.from(set).sort();
  }, [allGames]);

  const THEMES = useMemo(() => {
    const set = new Set<string>();
    allGames.forEach(g => g.themes?.forEach((theme: string) => set.add(theme)));
    return Array.from(set).sort();
  }, [allGames]);

  const PLATFORMS = useMemo(() => {
    const set = new Set<string>();
    allGames.forEach(g => g.platforms?.forEach((p: any) => set.add(p.name)));
    return Array.from(set).sort();
  }, [allGames]);

  const DEVELOPERS = useMemo(() => {
    const set = new Set<string>();
    allGames.forEach(g => { if (g.developer && g.developer !== 'Unknown Developer') set.add(g.developer); });
    return Array.from(set).sort();
  }, [allGames]);

  const PUBLISHERS = useMemo(() => {
    const set = new Set<string>();
    allGames.forEach(g => { if (g.publisher && g.publisher !== 'Unknown Publisher') set.add(g.publisher); });
    return Array.from(set).sort();
  }, [allGames]);

  const [scoreRange, setScoreRange] = useState([1, 10]);
  const [minInput, setMinInput] = useState("1");
  const [maxInput, setMaxInput] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("Highest Score");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [scoreError, setScoreError] = useState<string | null>(null);
  const [addedGames, setAddedGames] = useState<Record<string, string>>({});
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showLibraryLoginPrompt, setShowLibraryLoginPrompt] = useState(false);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleAddGameClick = (e: React.MouseEvent, gameId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isLoggedIn) {
      setShowLibraryLoginPrompt(true);
      return;
    }
    
    setActiveMenu(activeMenu === gameId ? null : gameId);
  };

  const handleSelectStatus = async (e: React.MouseEvent, gameId: string, status: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (status === '') {
      try {
        await removeFromLibraryByGameId(gameId);
        setAddedGames(prev => {
          const next = { ...prev };
          delete next[gameId];
          return next;
        });
      } catch (err) {
        console.error('Failed to remove from library:', err);
      }
    } else {
      try {
        await addToLibrary(gameId, status);
        setAddedGames(prev => ({ ...prev, [gameId]: status }));
      } catch (err) {
        console.error('Failed to add to library:', err);
      }
    }
    setActiveMenu(null);
  };

  const triggerError = () => {
    setScoreError("Score must be between 1 and 10");
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => setScoreError(null), 3000);
  };

  const handleSliderChange = (newRange: number[]) => {
    setScoreRange(newRange);
    setMinInput(newRange[0].toString());
    setMaxInput(newRange[1].toString());
  };

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    if (val === '') {
      setMinInput('');
      return;
    }

    if (val.includes('-') || parseFloat(val) < 0) {
      setMinInput('1');
      setScoreRange([1, Math.max(1, scoreRange[1])]);
      triggerError();
      return;
    }

    if (val === '0') {
      setMinInput('1');
      setScoreRange([1, Math.max(1, scoreRange[1])]);
      triggerError();
      return;
    }

    const num = parseFloat(val);
    if (num > 10) {
      setMinInput('10');
      setMaxInput('10');
      setScoreRange([10, 10]);
      triggerError();
      return;
    }

    if (!isNaN(num)) {
      setMinInput(val);
      if (num <= scoreRange[1]) {
        setScoreRange([num, scoreRange[1]]);
      } else {
        setScoreRange([num, num]);
        setMaxInput(num.toString());
      }
    }
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    if (val === '') {
      setMaxInput('');
      return;
    }

    if (val.includes('-') || parseFloat(val) < 0) {
      setMaxInput('1');
      setMinInput('1');
      setScoreRange([1, 1]);
      triggerError();
      return;
    }

    if (val === '0') {
      setMaxInput('1');
      setMinInput('1');
      setScoreRange([1, 1]);
      triggerError();
      return;
    }

    const num = parseFloat(val);
    if (num > 10) {
      setMaxInput('10');
      setScoreRange([scoreRange[0], 10]);
      triggerError();
      return;
    }

    if (!isNaN(num)) {
      setMaxInput(val);
      if (num >= scoreRange[0]) {
        setScoreRange([scoreRange[0], num]);
      } else {
        setScoreRange([num, num]);
        setMinInput(num.toString());
      }
    }
  };

  const handleMinBlur = () => {
    let num = parseFloat(minInput);
    if (isNaN(num)) {
      setMinInput('1');
      setScoreRange([1, scoreRange[1]]);
    } else {
      setMinInput(num.toString());
    }
  };

  const handleMaxBlur = () => {
    let num = parseFloat(maxInput);
    if (isNaN(num)) {
      setMaxInput('10');
      setScoreRange([scoreRange[0], 10]);
    } else {
      setMaxInput(num.toString());
    }
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const toggleTheme = (theme: string) => {
    setSelectedThemes(prev => 
      prev.includes(theme) ? prev.filter(t => t !== theme) : [...prev, theme]
    );
  };

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]
    );
  };

  const toggleDeveloper = (dev: string) => {
    setSelectedDevelopers(prev => 
      prev.includes(dev) ? prev.filter(d => d !== dev) : [...prev, dev]
    );
  };

  const togglePublisher = (pub: string) => {
    setSelectedPublishers(prev => 
      prev.includes(pub) ? prev.filter(p => p !== pub) : [...prev, pub]
    );
  };

  const toggleCollection = (col: string) => {
    setSelectedCollections(prev => 
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
  };

  // Reset to page 1 when any filter or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedGenres, selectedThemes, selectedPlatforms, selectedDevelopers, selectedPublishers, selectedCollections, scoreRange, sortBy]);

  // Filter logic
  let filteredGames = allGames.filter(game => {
    const matchesGenre = selectedGenres.length === 0 || selectedGenres.some(g => game.genres.includes(g));
    const matchesTheme = selectedThemes.length === 0 || selectedThemes.some(t => game.themes?.includes(t));
    const matchesDeveloper = selectedDevelopers.length === 0 || selectedDevelopers.includes(game.developer);
    const matchesPublisher = selectedPublishers.length === 0 || selectedPublishers.includes(game.publisher || "");
    
    // A game matches platform if it has AT LEAST ONE platform in the selectedPlatforms array
    const matchesPlatform = selectedPlatforms.length === 0 || selectedPlatforms.some(p => game.platforms.some(gp => gp.name === p));
    
    // A game matches score if:
    // - If platforms ARE selected: AT LEAST ONE of the SELECTED platforms has a score in the range.
    // - If NO platforms are selected: AT LEAST ONE of ANY of its platforms has a score in the range.
    const platformsToCheck = selectedPlatforms.length > 0
      ? game.platforms.filter(gp => selectedPlatforms.includes(gp.name))
      : game.platforms;
      
    const matchesScore = platformsToCheck.some(gp => gp.score >= scoreRange[0] && gp.score <= scoreRange[1]);
    
    const matchesCollection = selectedCollections.length === 0 || selectedCollections.every(col => {
      if (col === 'Newly Released') return game.releaseYear >= 2024;
      if (col === 'Trending Games') return game.platforms.some(p => p.score >= 9.0);
      return true;
    });

    return matchesGenre && matchesTheme && matchesDeveloper && matchesPublisher && matchesPlatform && matchesScore && matchesCollection;
  });

  // Helper to get the relevant score for sorting and display
  const getGameScore = (game: any) => {
    const platformsToCheck = selectedPlatforms.length > 0
      ? game.platforms.filter((gp: any) => selectedPlatforms.includes(gp.name))
      : game.platforms;
    if (platformsToCheck.length === 0) return 0;
    return Math.max(...platformsToCheck.map((p: any) => p.score));
  };

  // Sort logic
  if (sortBy === "Highest Score") {
    filteredGames.sort((a, b) => getGameScore(b) - getGameScore(a));
  } else if (sortBy === "Lowest Score") {
    filteredGames.sort((a, b) => getGameScore(a) - getGameScore(b));
  } else if (sortBy === "Release Date (Newest to Oldest)") {
    filteredGames.sort((a, b) => b.releaseYear - a.releaseYear);
  } else if (sortBy === "Release Date (Oldest to Newest)") {
    filteredGames.sort((a, b) => a.releaseYear - b.releaseYear);
  } else if (sortBy === "Alphabetical (A-Z)") {
    filteredGames.sort((a, b) => a.title.localeCompare(b.title));
  }

  // Pagination
  const totalPages = Math.ceil(filteredGames.length / GAMES_PER_PAGE);
  const startIndex = (currentPage - 1) * GAMES_PER_PAGE;
  const paginatedGames = filteredGames.slice(startIndex, startIndex + GAMES_PER_PAGE);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background text-text-main pb-20">
      {/* Header */}
      <div className="border-b border-border bg-surface/50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl font-bold text-white mb-2">Explore Games</h1>
          <p className="text-text-muted">Discover and filter through our entire catalog of games.</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-64 flex-shrink-0 space-y-6">
            {/* Collections */}
            <div className="border-b border-border pb-6">
              <button 
                onClick={() => setIsCollectionsOpen(!isCollectionsOpen)}
                className="flex w-full items-center justify-between text-lg font-bold text-white mb-4 group"
              >
                <div className="flex items-center gap-2 group-hover:text-primary transition-colors">
                  <Star className="h-4 w-4" />
                  Collections
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform duration-300 group-hover:text-primary ${isCollectionsOpen ? 'rotate-180' : ''}`} />
              </button>
              <div className={`space-y-3 overflow-hidden transition-all duration-300 ease-in-out ${isCollectionsOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                {COLLECTIONS.map(collection => (
                  <label key={collection} className="flex items-center gap-3 cursor-pointer group" onClick={(e) => { e.preventDefault(); toggleCollection(collection); }}>
                    <div className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${selectedCollections.includes(collection) ? 'bg-primary border-primary shadow-[0_0_10px_rgba(255,87,34,0.4)]' : 'border-border bg-surface group-hover:border-primary/50'}`}>
                      {selectedCollections.includes(collection) && <span className="h-2.5 w-2.5 rounded-sm bg-background" />}
                    </div>
                    <span className={`text-sm transition-colors ${selectedCollections.includes(collection) ? 'text-white font-medium' : 'text-text-muted group-hover:text-text-main'}`}>
                      {collection}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Platforms */}
            <div className="border-b border-border pb-6">
              <button 
                onClick={() => setIsPlatformsOpen(!isPlatformsOpen)}
                className="flex w-full items-center justify-between text-lg font-bold text-white mb-4 group"
              >
                <div className="flex items-center gap-2 group-hover:text-primary transition-colors">
                  <Gamepad2 className="h-4 w-4" />
                  Platforms
                  {selectedPlatforms.length > 0 && (
                    <span className="text-xs text-primary">({selectedPlatforms.length})</span>
                  )}
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform duration-300 group-hover:text-primary ${isPlatformsOpen ? 'rotate-180' : ''}`} />
              </button>
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isPlatformsOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full">
                {PLATFORMS.map(platform => (
                  <label key={platform} className="flex items-center gap-3 cursor-pointer group" onClick={(e) => { e.preventDefault(); togglePlatform(platform); }}>
                    <div className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${selectedPlatforms.includes(platform) ? 'bg-primary border-primary shadow-[0_0_10px_rgba(255,87,34,0.4)]' : 'border-border bg-surface group-hover:border-primary/50'}`}>
                      {selectedPlatforms.includes(platform) && <span className="h-2.5 w-2.5 rounded-sm bg-background" />}
                    </div>
                    <span className={`text-sm transition-colors ${selectedPlatforms.includes(platform) ? 'text-white font-medium' : 'text-text-muted group-hover:text-text-main'}`}>
                      {platform}
                    </span>
                  </label>
                ))}
              </div>
              </div>
            </div>

            {/* Genres */}
            <div className="border-b border-border pb-6">
              <button 
                onClick={() => setIsGenresOpen(!isGenresOpen)}
                className="flex w-full items-center justify-between text-lg font-bold text-white mb-4 group"
              >
                <div className="flex items-center gap-2 group-hover:text-primary transition-colors">
                  <Filter className="h-4 w-4" />
                  Genres
                  {selectedGenres.length > 0 && (
                    <span className="text-xs text-primary">({selectedGenres.length})</span>
                  )}
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform duration-300 group-hover:text-primary ${isGenresOpen ? 'rotate-180' : ''}`} />
              </button>
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isGenresOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full">
                {GENRES.map(genre => (
                  <label key={genre} className="flex items-center gap-3 cursor-pointer group" onClick={(e) => { e.preventDefault(); toggleGenre(genre); }}>
                    <div className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${selectedGenres.includes(genre) ? 'bg-primary border-primary shadow-[0_0_10px_rgba(255,87,34,0.4)]' : 'border-border bg-surface group-hover:border-primary/50'}`}>
                      {selectedGenres.includes(genre) && <span className="h-2.5 w-2.5 rounded-sm bg-background" />}
                    </div>
                    <span className={`text-sm transition-colors ${selectedGenres.includes(genre) ? 'text-white font-medium' : 'text-text-muted group-hover:text-text-main'}`}>
                      {genre}
                    </span>
                  </label>
                ))}
              </div>
              </div>
            </div>

            {/* Themes */}
            <div className="border-b border-border pb-6">
              <button 
                onClick={() => setIsThemesOpen(!isThemesOpen)}
                className="flex w-full items-center justify-between text-lg font-bold text-white mb-4 group"
              >
                <div className="flex items-center gap-2 group-hover:text-primary transition-colors">
                  <Filter className="h-4 w-4" />
                  Themes
                  {selectedThemes.length > 0 && (
                    <span className="text-xs text-primary">({selectedThemes.length})</span>
                  )}
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform duration-300 group-hover:text-primary ${isThemesOpen ? 'rotate-180' : ''}`} />
              </button>
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isThemesOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full">
                {THEMES.map(theme => (
                  <label key={theme} className="flex items-center gap-3 cursor-pointer group" onClick={(e) => { e.preventDefault(); toggleTheme(theme); }}>
                    <div className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${selectedThemes.includes(theme) ? 'bg-primary border-primary shadow-[0_0_10px_rgba(255,87,34,0.4)]' : 'border-border bg-surface group-hover:border-primary/50'}`}>
                      {selectedThemes.includes(theme) && <span className="h-2.5 w-2.5 rounded-sm bg-background" />}
                    </div>
                    <span className={`text-sm transition-colors ${selectedThemes.includes(theme) ? 'text-white font-medium' : 'text-text-muted group-hover:text-text-main'}`}>
                      {theme}
                    </span>
                  </label>
                ))}
              </div>
              </div>
            </div>

            {/* Developers */}
            <div className="border-b border-border pb-6">
              <button
                onClick={() => setIsDevelopersOpen(!isDevelopersOpen)}
                className="flex w-full items-center justify-between text-lg font-bold text-white mb-4 group"
              >
                <div className="flex items-center gap-2 group-hover:text-primary transition-colors">
                  <Filter className="h-4 w-4" />
                  Developer
                  {selectedDevelopers.length > 0 && (
                    <span className="text-xs text-primary">({selectedDevelopers.length})</span>
                  )}
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform duration-300 group-hover:text-primary ${isDevelopersOpen ? 'rotate-180' : ''}`} />
              </button>
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isDevelopersOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <input
                  type="text"
                  placeholder="Search developers..."
                  value={developerSearch}
                  onChange={(e) => setDeveloperSearch(e.target.value)}
                  className="w-full mb-3 bg-background border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-text-muted focus:outline-none focus:border-primary/50 focus:shadow-[0_0_10px_rgba(255,87,34,0.15)] transition-all"
                />
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full">
                  {DEVELOPERS
                    .filter(dev => dev.toLowerCase().includes(developerSearch.toLowerCase()))
                    .map(dev => (
                    <label key={dev} className="flex items-center gap-3 cursor-pointer group" onClick={(e) => { e.preventDefault(); toggleDeveloper(dev); }}>
                      <div className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${selectedDevelopers.includes(dev) ? 'bg-primary border-primary shadow-[0_0_10px_rgba(255,87,34,0.4)]' : 'border-border bg-surface group-hover:border-primary/50'}`}>
                        {selectedDevelopers.includes(dev) && <span className="h-2.5 w-2.5 rounded-sm bg-background" />}
                      </div>
                      <span className={`text-sm transition-colors ${selectedDevelopers.includes(dev) ? 'text-white font-medium' : 'text-text-muted group-hover:text-text-main'}`}>
                        {dev}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Publishers */}
            <div className="border-b border-border pb-6">
              <button
                onClick={() => setIsPublishersOpen(!isPublishersOpen)}
                className="flex w-full items-center justify-between text-lg font-bold text-white mb-4 group"
              >
                <div className="flex items-center gap-2 group-hover:text-primary transition-colors">
                  <Filter className="h-4 w-4" />
                  Publisher
                  {selectedPublishers.length > 0 && (
                    <span className="text-xs text-primary">({selectedPublishers.length})</span>
                  )}
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform duration-300 group-hover:text-primary ${isPublishersOpen ? 'rotate-180' : ''}`} />
              </button>
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isPublishersOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <input
                  type="text"
                  placeholder="Search publishers..."
                  value={publisherSearch}
                  onChange={(e) => setPublisherSearch(e.target.value)}
                  className="w-full mb-3 bg-background border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-text-muted focus:outline-none focus:border-primary/50 focus:shadow-[0_0_10px_rgba(255,87,34,0.15)] transition-all"
                />
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full">
                  {PUBLISHERS
                    .filter(pub => pub.toLowerCase().includes(publisherSearch.toLowerCase()))
                    .map(pub => (
                    <label key={pub} className="flex items-center gap-3 cursor-pointer group" onClick={(e) => { e.preventDefault(); togglePublisher(pub); }}>
                      <div className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${selectedPublishers.includes(pub) ? 'bg-primary border-primary shadow-[0_0_10px_rgba(255,87,34,0.4)]' : 'border-border bg-surface group-hover:border-primary/50'}`}>
                        {selectedPublishers.includes(pub) && <span className="h-2.5 w-2.5 rounded-sm bg-background" />}
                      </div>
                      <span className={`text-sm transition-colors ${selectedPublishers.includes(pub) ? 'text-white font-medium' : 'text-text-muted group-hover:text-text-main'}`}>
                        {pub}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Score Filter */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Star className="h-4 w-4 text-primary" />
                PixelCritic Score
              </h3>
              <div className="px-2">
                <Slider.Root
                  className="relative flex items-center select-none touch-none w-full h-5 mb-4"
                  value={scoreRange}
                  max={10}
                  min={1}
                  step={0.1}
                  onValueChange={handleSliderChange}
                >
                  <Slider.Track className="bg-surface border border-border relative grow rounded-full h-2">
                    <Slider.Range className="absolute bg-primary rounded-full h-full shadow-[0_0_10px_rgba(255,87,34,0.5)]" />
                  </Slider.Track>
                  <Slider.Thumb
                    className="block w-5 h-5 bg-white border-2 border-primary shadow-[0_0_15px_rgba(255,87,34,0.8)] rounded-full hover:bg-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors cursor-grab active:cursor-grabbing"
                    aria-label="Minimum Score"
                  />
                  <Slider.Thumb
                    className="block w-5 h-5 bg-white border-2 border-primary shadow-[0_0_15px_rgba(255,87,34,0.8)] rounded-full hover:bg-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors cursor-grab active:cursor-grabbing"
                    aria-label="Maximum Score"
                  />
                </Slider.Root>
                <div className="flex items-center text-sm font-medium mt-4">
                  <span className="text-text-muted mr-6">Score Range:</span>
                  <div className="flex items-center gap-2 ml-auto">
                    <input 
                      type="number" 
                      value={minInput}
                      onChange={handleMinChange}
                      onBlur={handleMinBlur}
                      className="w-16 bg-background border border-border rounded px-2 py-1 text-white text-center focus:outline-none focus:border-primary focus:shadow-[0_0_10px_rgba(255,87,34,0.3)] transition-all appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <span className="text-text-muted">-</span>
                    <input 
                      type="number" 
                      value={maxInput}
                      onChange={handleMaxChange}
                      onBlur={handleMaxBlur}
                      className="w-16 bg-background border border-border rounded px-2 py-1 text-white text-center focus:outline-none focus:border-primary focus:shadow-[0_0_10px_rgba(255,87,34,0.3)] transition-all appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                  </div>
                </div>
                <div className="h-4 mt-2 text-right">
                  {scoreError && (
                    <span className="text-xs text-primary animate-pulse">
                      {scoreError}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
              <p className="text-text-muted text-sm">
                Showing <span className="text-white font-bold">{startIndex + 1}–{Math.min(startIndex + GAMES_PER_PAGE, filteredGames.length)}</span> of <span className="text-white font-bold">{filteredGames.length}</span> games
              </p>

              {/* Sort Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setIsSortOpen(!isSortOpen)}
                  className="flex items-center gap-2 bg-surface border border-border rounded-lg px-4 py-2 text-sm font-medium text-white hover:border-primary/50 hover:shadow-[0_0_15px_rgba(255,87,34,0.15)] transition-all"
                >
                  Sort By: <span className="text-primary">{sortBy}</span>
                  <ChevronDown className="h-4 w-4 text-text-muted" />
                </button>

                {isSortOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border bg-surface shadow-2xl backdrop-blur-xl z-20 overflow-hidden">
                    {SORT_OPTIONS.map(option => (
                      <button
                        key={option}
                        onClick={() => {
                          setSortBy(option);
                          setIsSortOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-surface-hover ${sortBy === option ? 'text-primary font-bold bg-primary/5' : 'text-text-main'}`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Game Grid */}
            {filteredGames.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center border border-border border-dashed rounded-2xl bg-surface/30">
                <Gamepad2 className="h-12 w-12 text-text-muted mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-white mb-2">No games found</h3>
                <p className="text-text-muted max-w-md">Try adjusting your filters to find what you're looking for.</p>
                <button
                  onClick={() => {
                    setSelectedCollections([]);
                    setSelectedGenres([]);
                    setSelectedThemes([]);
                    setSelectedPlatforms([]);
                    setSelectedDevelopers([]);
                    setSelectedPublishers([]);
                    setScoreRange([1, 10]);
                    setMinInput("1");
                    setMaxInput("10");
                  }}
                  className="mt-6 text-primary hover:text-primary-hover font-medium underline underline-offset-4"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {paginatedGames.map((game) => (
                    <GameCard
                      key={game._id}
                      game={game}
                      addedGames={addedGames}
                      activeMenu={activeMenu}
                      handleAddGameClick={handleAddGameClick}
                      handleSelectStatus={handleSelectStatus}
                      selectedPlatforms={selectedPlatforms}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-12 flex items-center justify-center gap-2">
                    {/* Previous Button */}
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface text-text-muted transition-all hover:border-primary/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:text-text-muted"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    {/* Page Numbers */}
                    {getPageNumbers().map((page, idx) =>
                      page === '...' ? (
                        <span key={`ellipsis-${idx}`} className="flex h-10 w-10 items-center justify-center text-text-muted text-sm">
                          ...
                        </span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page as number)}
                          className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold transition-all ${
                            currentPage === page
                              ? 'bg-primary text-white shadow-[0_0_15px_rgba(255,87,34,0.4)] border border-primary'
                              : 'border border-border bg-surface text-text-muted hover:border-primary/50 hover:text-white'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}

                    {/* Next Button */}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface text-text-muted transition-all hover:border-primary/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:text-text-muted"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Login Prompt Modal */}
      {showLibraryLoginPrompt && !isLoggedIn && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowLibraryLoginPrompt(false)}
        >
          <div 
            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-[#1a1a1a] border-t-4 border-t-primary shadow-[0_10px_40px_rgba(0,0,0,0.8)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowLibraryLoginPrompt(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="p-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                <Gamepad2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-display text-2xl font-bold text-white">Login Required</h3>
              <p className="mb-8 text-text-muted">
                Join PixelCritic to build your personal gaming library, track your backlog, and rate games.
              </p>
              
              <Link 
                to="/login"
                className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-6 py-3 font-bold text-white shadow-[0_0_15px_rgba(255,87,34,0.4)] transition-all hover:bg-primary-hover hover:shadow-[0_0_25px_rgba(255,87,34,0.6)]"
              >
                Log In
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
