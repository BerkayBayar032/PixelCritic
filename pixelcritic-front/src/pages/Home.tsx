import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, Gamepad2, ArrowRight, TrendingUp, Sparkles, Calendar, Plus, Layers, X, ChevronDown } from 'lucide-react';
import GameCard from '../components/GameCard';
import { useAuth } from '../context/UserContext';
import { getTrendingGames, getNewReleases, getGamesByGenre } from '../services/gameService';
import { addToLibrary, getLibrary, removeFromLibraryByGameId } from '../services/libraryService';
import { getRecommendations } from '../services/aiService';

const ALL_GENRES = [
  "Action", "Adventure", "Arcade", "Card & Board Game", "Fighting",
  "Indie", "MOBA", "Music", "Pinball", "Platform", "Point-and-click",
  "Puzzle", "Quiz/Trivia", "Racing", "Real Time Strategy (RTS)",
  "Role-playing (RPG)", "Shooter", "Simulator", "Sport", "Strategy",
  "Tactical", "Turn-based strategy (TBS)", "Visual Novel",
  "Hack and slash/Beat 'em up",
];

export default function Home() {
  const { isLoggedIn, user } = useAuth();
  const [activeTab, setActiveTab] = useState('Shooter');
  const [isGenreDropdownOpen, setIsGenreDropdownOpen] = useState(false);
  const [trendingGames, setTrendingGames] = useState<any[]>([]);
  const [newReleaseGames, setNewReleaseGames] = useState<any[]>([]);
  const [genreGames, setGenreGames] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [aiPicks, setAiPicks] = useState<any[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [addedGames, setAddedGames] = useState<Record<string, string>>({});
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showLibraryLoginPrompt, setShowLibraryLoginPrompt] = useState(false);
  const navigate = useNavigate();

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
          const newAddedGames = { ...prev };
          delete newAddedGames[gameId];
          return newAddedGames;
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

  useEffect(() => {
    const handleClickOutside = () => {
      setActiveMenu(null);
      setIsGenreDropdownOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
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

  // Fetch trending + new releases on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [trending, newRels] = await Promise.all([
          getTrendingGames(6),
          getNewReleases(6),
        ]);
        setTrendingGames(trending);
        setNewReleaseGames(newRels);
      } catch (err) {
        console.error('Failed to fetch games:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch genre games when tab changes
  useEffect(() => {
    const fetchGenre = async () => {
      try {
        const games = await getGamesByGenre(activeTab, 6);
        setGenreGames(games);
      } catch (err) {
        console.error('Failed to fetch genre games:', err);
        setGenreGames([]);
      }
    };
    fetchGenre();
  }, [activeTab]);

  // Fetch AI recommendations for logged-in users
  useEffect(() => {
    if (!isLoggedIn) return;
    const fetchAI = async () => {
      setAiLoading(true);
      try {
        const result = await getRecommendations();
        setAiPicks(result.recommendations || []);
        setAiMessage(result.message || '');
      } catch (err) {
        console.error('Failed to fetch AI recommendations:', err);
        setAiMessage('AI recommendations are currently unavailable.');
      } finally {
        setAiLoading(false);
      }
    };
    fetchAI();
  }, [isLoggedIn]);

  return (
    <div className="min-h-screen bg-background text-text-main pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border bg-surface/30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,87,34,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(26,26,46,0.8),transparent_50%)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary shadow-[0_0_15px_rgba(255,87,34,0.2)]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
              </span>
              AI-Powered Game Discovery
            </div>

            <h1 className="font-display text-5xl font-extrabold tracking-tight sm:text-7xl mb-6">
              Your Ultimate <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#FF8A65] drop-shadow-[0_0_25px_rgba(255,87,34,0.5)]">
                Gaming Hub
              </span>
            </h1>

            <p className="mx-auto max-w-2xl text-lg text-text-muted sm:text-xl mb-10">
              Track your playtime, write comprehensive reviews, and discover your next favorite game with our advanced AI recommendation engine.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
              <Link
                to="/explore"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-bold text-white shadow-[0_0_20px_rgba(255,87,34,0.4)] transition-all hover:bg-primary-hover hover:shadow-[0_0_30px_rgba(255,87,34,0.6)] hover:-translate-y-1"
              >
                <Gamepad2 className="h-5 w-5" />
                Explore Games
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Games Section */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface border border-border">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <h2 className="font-display text-3xl font-bold tracking-tight">Trending Now</h2>
          </div>
          <button onClick={() => navigate('/explore?collection=trending')} className="text-sm font-medium text-primary hover:text-primary-hover flex items-center gap-1 group">
            View All <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 rounded-2xl bg-surface animate-pulse border border-border" />
            ))}
          </div>
        ) : trendingGames.length === 0 ? (
          <div className="text-center py-12 text-text-muted">
            <p>No games found. Run <code className="text-primary">npm run seed</code> in the backend to populate the database.</p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
            {trendingGames.map((game) => (
              <GameCard
                key={game._id}
                game={game}
                addedGames={addedGames}
                activeMenu={activeMenu}
                handleAddGameClick={handleAddGameClick}
                handleSelectStatus={handleSelectStatus}
              />
            ))}
          </div>
        )}
      </section>

      {/* AI-Powered Picks Section */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {!isLoggedIn ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-primary/20 bg-surface/50 p-12 text-center shadow-[0_0_30px_rgba(255,87,34,0.05)] backdrop-blur-sm">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 border border-primary/30 shadow-[0_0_20px_rgba(255,87,34,0.2)]">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h2 className="font-display text-3xl font-bold text-white mb-3">
              Unlock Personalized AI Recommendations
            </h2>
            <p className="mx-auto max-w-xl text-text-muted mb-8">
              Sign in to let our machine learning engine analyze your library and reviews to find your next masterpiece.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(255,87,34,0.4)] transition-all hover:bg-primary-hover hover:shadow-[0_0_30px_rgba(255,87,34,0.6)] hover:-translate-y-1"
            >
              Log In
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/30 shadow-[0_0_15px_rgba(255,87,34,0.2)]">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <h2 className="font-display text-3xl font-bold tracking-tight text-white flex items-center">
                  For You
                  <span className="ml-4 inline-flex items-center rounded-full border border-primary bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
                    AI-Powered
                  </span>
                </h2>
              </div>
            </div>

            {aiLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface border-t-primary"></div>
                <span className="ml-3 text-text-muted">Analyzing your taste...</span>
              </div>
            ) : aiPicks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {aiPicks.map((pick: any, idx: number) => (
                  <div
                    key={idx}
                    onClick={() => pick.game && navigate(`/games/${pick.game._id}`)}
                    className={`rounded-2xl border border-border bg-surface p-6 transition-all hover:border-primary/50 hover:shadow-[0_0_20px_rgba(255,87,34,0.1)] ${pick.game ? 'cursor-pointer' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-display text-lg font-bold text-white">{pick.title}</h3>
                      <div className="flex items-center gap-1 rounded-full bg-primary/10 border border-primary/30 px-2.5 py-1">
                        <Sparkles className="h-3 w-3 text-primary" />
                        <span className="text-xs font-bold text-primary">{pick.matchScore}%</span>
                      </div>
                    </div>
                    <p className="text-sm text-text-muted leading-relaxed">{pick.reason}</p>
                    {pick.game && (
                      <div className="mt-4 flex items-center gap-2 text-xs text-text-muted">
                        <Gamepad2 className="h-3 w-3" />
                        <span>{pick.game.genres?.join(', ')}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-muted ml-14">
                {aiMessage || 'Add games to your library or write reviews to get personalized recommendations!'}
              </p>
            )}
          </>
        )}
      </section>

      {/* Newly Released Section */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 mb-16">
        <div className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface border border-border">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-white">Newly Released</h2>
          </div>
          <button onClick={() => navigate('/explore?collection=newly-released')} className="text-sm font-medium text-primary hover:text-primary-hover flex items-center gap-1 group">
            View All <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {newReleaseGames.length === 0 ? (
          <div className="text-center py-12 text-text-muted">
            <p>No new releases found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
            {newReleaseGames.map((game) => (
              <GameCard
                key={game._id}
                game={game}
                addedGames={addedGames}
                activeMenu={activeMenu}
                handleAddGameClick={handleAddGameClick}
                handleSelectStatus={handleSelectStatus}
              />
            ))}
          </div>
        )}
      </section>

      {/* Top Rated by Genre Section */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 mb-16">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface border border-border">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-white">Top Rated by Genre</h2>
          </div>

          {/* Genre Dropdown */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setIsGenreDropdownOpen(!isGenreDropdownOpen)}
              className="flex items-center gap-2 rounded-full bg-surface/50 border border-border/50 backdrop-blur-sm px-5 py-2.5 text-sm font-bold text-white hover:border-primary/50 hover:shadow-[0_0_15px_rgba(255,87,34,0.15)] transition-all"
            >
              <Layers className="h-4 w-4 text-primary" />
              <span className="text-primary">{activeTab}</span>
              <ChevronDown className={`h-4 w-4 text-text-muted transition-transform duration-300 ${isGenreDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isGenreDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 max-h-80 overflow-y-auto rounded-xl border border-border bg-surface shadow-2xl backdrop-blur-xl z-20 overflow-hidden [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full">
                {ALL_GENRES.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => {
                      setActiveTab(genre);
                      setIsGenreDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-surface-hover ${
                      activeTab === genre
                        ? 'text-primary font-bold bg-primary/5'
                        : 'text-text-main hover:text-white'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Content Rendering */}
        {genreGames.length === 0 ? (
          <div className="text-center py-12 text-text-muted">
            <p>No games found for "{activeTab}" genre.</p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
            {genreGames.map((game) => (
              <GameCard
                key={game._id}
                game={game}
                addedGames={addedGames}
                activeMenu={activeMenu}
                handleAddGameClick={handleAddGameClick}
                handleSelectStatus={handleSelectStatus}
              />
            ))}
          </div>
        )}
      </section>

      {/* Library Login Prompt Modal */}
      {showLibraryLoginPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-primary/20 bg-surface p-8 shadow-[0_0_40px_rgba(255,87,34,0.15)]">
            <button
              onClick={() => setShowLibraryLoginPrompt(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-text-muted hover:bg-background hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 border border-primary/30 shadow-[0_0_20px_rgba(255,87,34,0.2)] mx-auto">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>

            <h3 className="font-display text-2xl font-bold text-white mb-3 text-center">
              Sign In Required
            </h3>

            <p className="text-text-muted mb-8 text-center">
              You need to be logged in to add games to your library and track your progress.
            </p>

            <div className="flex flex-col gap-3">
              <Link
                to="/login"
                className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-[0_0_15px_rgba(255,87,34,0.4)] transition-all hover:bg-primary-hover hover:shadow-[0_0_25px_rgba(255,87,34,0.6)]"
              >
                Log In
              </Link>
              <button
                onClick={() => setShowLibraryLoginPrompt(false)}
                className="inline-flex w-full items-center justify-center rounded-xl bg-background border border-border px-4 py-3 text-sm font-bold text-white transition-all hover:bg-surface hover:border-primary/50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
