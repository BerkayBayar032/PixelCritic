import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Star, ThumbsUp, ThumbsDown, Calendar, Building2, ArrowLeft, MessageSquare, 
  Plus, X, CheckCircle2, PlayCircle, Clock, XCircle, ChevronDown, Trash2,
  Monitor, Gamepad, Gamepad2, Smartphone
} from 'lucide-react';
import { useAuth } from '../context/UserContext';
import { getGameById } from '../services/gameService';
import { getReviewsByGame, createReview, deleteReview, voteOnReview, getMyVotes } from '../services/reviewService';
import { getLibraryEntry, addToLibrary, removeFromLibraryByGameId } from '../services/libraryService';
import { rateGame as rateGameAPI, getMyRating, deleteMyRating } from '../services/ratingService';
import { getGameAnalysis } from '../services/aiService';

const SORT_OPTIONS = [
  "Most Liked",
  "Most Disliked",
  "Newest",
  "Oldest"
];

const getPlatformIcon = (platformName: string) => {
  if (platformName.includes('PC')) return <Monitor className="h-5 w-5 text-text-muted group-hover:text-primary transition-colors" />;
  if (platformName.includes('PlayStation')) return <Gamepad className="h-5 w-5 text-text-muted group-hover:text-primary transition-colors" />;
  if (platformName.includes('Xbox')) return <Gamepad2 className="h-5 w-5 text-text-muted group-hover:text-primary transition-colors" />;
  if (platformName.includes('Switch')) return <Smartphone className="h-5 w-5 text-text-muted group-hover:text-primary transition-colors" />;
  return <Gamepad2 className="h-5 w-5 text-text-muted group-hover:text-primary transition-colors" />;
};

export default function GameDetails() {
  const { isLoggedIn, user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [userVotes, setUserVotes] = useState<Record<string, string>>({});
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);

  // Modal States
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  
  // Form States
  const [playStatus, setPlayStatus] = useState<string | null>(null);
  const [libraryEntryId, setLibraryEntryId] = useState<string | null>(null);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [ratingPlatform, setRatingPlatform] = useState<string>('');
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewPlatform, setReviewPlatform] = useState<string>('');
  const [isReviewFocused, setIsReviewFocused] = useState(false);
  const [reviewFilterPlatform, setReviewFilterPlatform] = useState<string>('All Platforms');
  const [sortBy, setSortBy] = useState<string>("Most Liked");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isPlatformFilterOpen, setIsPlatformFilterOpen] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showLibraryLoginPrompt, setShowLibraryLoginPrompt] = useState(false);
  const [showRatingPrompt, setShowRatingPrompt] = useState(false);
  const [showReviewActionPrompt, setShowReviewActionPrompt] = useState<string | null>(null);
  const loginPromptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (loginPromptRef.current && !loginPromptRef.current.contains(event.target as Node)) {
        setShowLoginPrompt(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchGameDetails = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const data = await getGameById(id);
        setGame(data);
      } catch (err) {
        console.error('Failed to fetch game:', err);
        setGame(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGameDetails();
  }, [id]);

  // Fetch reviews when game, sort, or platform filter changes
  const sortMap: Record<string, string> = {
    'Most Liked': 'most_liked',
    'Most Disliked': 'most_disliked',
    'Newest': 'newest',
    'Oldest': 'oldest',
  };

  useEffect(() => {
    const fetchReviews = async () => {
      if (!id) return;
      setReviewsLoading(true);
      try {
        const params: any = { sort: sortMap[sortBy] || 'newest' };
        if (reviewFilterPlatform !== 'All Platforms') params.platform = reviewFilterPlatform;
        const result = await getReviewsByGame(id, params);
        setReviews(result.data);
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
      } finally {
        setReviewsLoading(false);
      }
    };
    fetchReviews();
  }, [id, sortBy, reviewFilterPlatform]);

  // Fetch user's votes for this game's reviews
  useEffect(() => {
    const fetchVotes = async () => {
      if (!id || !isLoggedIn) return;
      try {
        const votes = await getMyVotes(id);
        setUserVotes(votes);
      } catch (err) {
        console.error('Failed to fetch votes:', err);
      }
    };
    fetchVotes();
  }, [id, isLoggedIn]);

  // Fetch AI analysis once when reviews are first loaded
  const aiAnalysisFetched = useRef(false);
  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!id || reviews.length === 0 || aiAnalysisFetched.current) return;
      aiAnalysisFetched.current = true;
      setAiAnalysisLoading(true);
      try {
        const result = await getGameAnalysis(id);
        setAiAnalysis(result.analysis);
      } catch (err) {
        console.error('Failed to fetch AI analysis:', err);
      } finally {
        setAiAnalysisLoading(false);
      }
    };
    fetchAnalysis();
  }, [id, reviews.length]);

  // Fetch user's library entry and rating for this game
  useEffect(() => {
    const fetchUserData = async () => {
      if (!id || !isLoggedIn) return;
      try {
        const [libEntry, ratingEntry] = await Promise.all([
          getLibraryEntry(id),
          getMyRating(id),
        ]);
        if (libEntry) {
          setPlayStatus(libEntry.status);
          setLibraryEntryId(libEntry._id);
        }
        if (ratingEntry) {
          setUserRating(ratingEntry.score);
          setRating(ratingEntry.score);
          setRatingPlatform(ratingEntry.platform);
        }
      } catch (err) {
        console.error('Failed to fetch user data:', err);
      }
    };
    fetchUserData();
  }, [id, isLoggedIn]);

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isLibraryModalOpen || isRatingModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isLibraryModalOpen, isRatingModalOpen]);

  const handleLike = async (reviewId: string) => {
    if (!isLoggedIn) {
      setShowReviewActionPrompt(reviewId);
      return;
    }
    try {
      const result = await voteOnReview(reviewId, 'upvote');
      setReviews(current =>
        current.map(rev => rev._id === reviewId ? { ...rev, upvotes: result.upvotes, downvotes: result.downvotes } : rev)
      );
      setUserVotes(prev => {
        const next = { ...prev };
        if (prev[reviewId] === 'upvote') delete next[reviewId];
        else next[reviewId] = 'upvote';
        return next;
      });
    } catch (err) {
      console.error('Failed to vote:', err);
    }
  };

  const handleDislike = async (reviewId: string) => {
    if (!isLoggedIn) {
      setShowReviewActionPrompt(reviewId);
      return;
    }
    try {
      const result = await voteOnReview(reviewId, 'downvote');
      setReviews(current =>
        current.map(rev => rev._id === reviewId ? { ...rev, upvotes: result.upvotes, downvotes: result.downvotes } : rev)
      );
      setUserVotes(prev => {
        const next = { ...prev };
        if (prev[reviewId] === 'downvote') delete next[reviewId];
        else next[reviewId] = 'downvote';
        return next;
      });
    } catch (err) {
      console.error('Failed to vote:', err);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await deleteReview(reviewId);
      setReviews(current => current.filter(rev => rev._id !== reviewId));
    } catch (err) {
      console.error('Failed to delete review:', err);
    }
  };

  const handlePostReview = async () => {
    if (!reviewText.trim() || !reviewPlatform || !id) return;
    try {
      const newReview = await createReview(id, reviewText.trim(), reviewRating || undefined, reviewPlatform);
      setReviews(current => [newReview, ...current]);
      setReviewText('');
      setReviewPlatform('');
      setReviewRating(0);
      setIsReviewFocused(false);
    } catch (err: any) {
      console.error('Failed to post review:', err);
      alert(err.response?.data?.message || 'Failed to post review');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-surface border-t-primary"></div>
      </div>
    );
  }

  if (!game) return null;

  return (
    <div className="min-h-screen bg-background text-text-main pb-20">
      {/* Top Section / Hero */}
      <div className="relative min-h-[600px] w-full bg-surface pt-20 pb-16">
        {game.coverImage && (
          <img
            src={game.coverImage.replace('t_cover_big', 't_1080p')}
            alt={game.title}
            className="absolute inset-0 h-full w-full object-cover opacity-15"
            referrerPolicy="no-referrer"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-transparent" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-10">
          <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-text-muted hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left Column: Cover + Title, Info, Actions, Genres, Themes */}
            <div className="lg:col-span-2 flex flex-col">
              <div className="flex flex-col sm:flex-row gap-8 mb-6">
                {/* Game Cover */}
                {game.coverImage && (
                  <div className="shrink-0">
                    <img
                      src={game.coverImage}
                      alt={game.title}
                      className="w-48 rounded-xl border-2 border-border shadow-[0_0_30px_rgba(0,0,0,0.6)] object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                {/* Title + Meta */}
                <div className="flex flex-col justify-end">
                  <h1 className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl mb-4 drop-shadow-lg">
                    {game.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-text-muted">Developer:</span>
                      <span className="font-bold text-white">{game.developer}</span>
                    </div>
                    <span className="text-text-muted/30 hidden sm:inline">•</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-text-muted">Publisher:</span>
                      <span className="font-bold text-white">{game.publisher || "Unknown"}</span>
                    </div>
                    <span className="text-text-muted/30 hidden sm:inline">•</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-text-muted">Release:</span>
                      <span className="font-bold text-white">{game.releaseYear}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 mb-12">
                {playStatus ? (
                  <button
                    onClick={async () => {
                      if (!id) return;
                      try {
                        await removeFromLibraryByGameId(id);
                        setPlayStatus(null);
                        setLibraryEntryId(null);
                      } catch (err) {
                        console.error('Failed to remove from library:', err);
                      }
                    }}
                    className="flex items-center gap-2 rounded-full border border-[#4b5563] bg-transparent px-6 py-3 font-bold text-[#9ca3af] transition-all hover:-translate-y-0.5 hover:border-[#ff5500] hover:text-[#ff5500] hover:shadow-[0_0_25px_rgba(255,85,0,0.4)]"
                  >
                    Remove from Library
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      if (!isLoggedIn) {
                        setShowLibraryLoginPrompt(true);
                      } else {
                        setIsLibraryModalOpen(true);
                      }
                    }}
                    className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-bold text-white shadow-[0_0_15px_rgba(255,87,34,0.4)] transition-all hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-[0_0_25px_rgba(255,87,34,0.6)]"
                  >
                    <Plus className="h-5 w-5" />
                    Add to Library
                  </button>
                )}
                <button 
                  onClick={() => {
                    if (!isLoggedIn) {
                      setShowRatingPrompt(true);
                    } else {
                      if (userRating !== null) {
                        setRating(userRating);
                      }
                      setIsRatingModalOpen(true);
                    }
                  }}
                  className={userRating !== null
                    ? "flex items-center gap-2 rounded-full border border-[#ff5500] bg-[#ff5500]/10 px-6 py-3 font-bold text-[#ff5500] backdrop-blur-md transition-all hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgba(255,85,0,0.4)]"
                    : "flex items-center gap-2 rounded-full border border-border bg-surface/80 px-6 py-3 font-bold text-text-main backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:text-primary"
                  }
                >
                  <Star className="h-5 w-5" />
                  {userRating !== null ? `Your Rating: ${userRating}/10` : 'Rate Game'}
                </button>
              </div>
              
              {/* Genres & Themes */}
              <div className="space-y-8">
                {/* Genres Block */}
                <div>
                  <h3 className="text-lg font-bold text-white mb-3 font-display tracking-wide">Genres</h3>
                  <div className="flex flex-wrap gap-2">
                    {game.genres.map((genre: string) => (
                      <span key={genre} className="rounded-md bg-surface border border-border px-3 py-1.5 text-sm font-medium text-text-main transition-colors hover:border-primary/40 hover:text-white cursor-default">
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Themes Block */}
                <div>
                  <h3 className="text-lg font-bold text-white mb-3 font-display tracking-wide">Themes</h3>
                  <div className="flex flex-wrap gap-2">
                    {game.themes.map((theme: string) => (
                      <span key={theme} className="rounded-md bg-surface border border-border px-3 py-1.5 text-sm font-medium text-text-main transition-colors hover:border-primary/40 hover:text-white cursor-default">
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Column: Scores & Platforms */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              {/* All Platforms */}
              <div className="rounded-2xl border border-border bg-surface/50 backdrop-blur-md p-6 shadow-xl">
                <h3 className="font-display text-xl font-bold text-white mb-6 border-b border-border pb-4">All Platforms</h3>
                <div className="space-y-4">
                  {game.platforms.map((platform: any) => (
                    <div key={platform.name} className="flex items-center justify-between gap-3 group pb-4 border-b border-border/50 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background border border-border group-hover:border-primary/30 transition-colors">
                          {getPlatformIcon(platform.name)}
                        </div>
                        <span className="font-medium text-text-main group-hover:text-white transition-colors truncate">{platform.name}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5 bg-background/50 px-3 py-1.5 rounded-full border border-border">
                        <span className="font-mono font-bold text-white">{platform.score?.toFixed(1)}</span>
                        <Star className="h-4 w-4 fill-primary text-primary drop-shadow-[0_0_8px_rgba(255,87,34,0.8)]" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface border border-border">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <h2 className="font-display text-3xl font-bold tracking-tight">Reviews & Ratings</h2>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div className="relative">
              <button
                onClick={() => setIsPlatformFilterOpen(!isPlatformFilterOpen)}
                className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium transition-all hover:border-primary/30 hover:text-white"
              >
                <span className="text-text-muted">Platform:</span>
                <span className="text-primary">{reviewFilterPlatform}</span>
                <ChevronDown className={`h-4 w-4 text-text-muted transition-transform ${isPlatformFilterOpen ? 'rotate-180' : ''}`} />
              </button>

              {isPlatformFilterOpen && (
                <div className="absolute left-0 mt-2 w-64 rounded-xl border border-border bg-surface shadow-2xl backdrop-blur-xl z-20 overflow-hidden">
                  <button
                    onClick={() => { setReviewFilterPlatform('All Platforms'); setIsPlatformFilterOpen(false); }}
                    className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-surface-hover hover:text-primary ${reviewFilterPlatform === 'All Platforms' ? 'text-primary font-bold bg-primary/5' : 'text-text-main'}`}
                  >
                    All Platforms
                  </button>
                  {game.platforms.map((p: any) => (
                    <button
                      key={p.name}
                      onClick={() => { setReviewFilterPlatform(p.name); setIsPlatformFilterOpen(false); }}
                      className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-surface-hover hover:text-primary ${reviewFilterPlatform === p.name ? 'text-primary font-bold bg-primary/5' : 'text-text-main'}`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative hidden lg:block">
              <button 
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="flex items-center gap-2 text-sm text-text-muted hover:text-white transition-colors"
              >
                Sorted by <span className="text-primary font-medium">{sortBy}</span>
                <ChevronDown className="h-4 w-4" />
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
                      className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-surface-hover hover:text-primary ${sortBy === option ? 'text-primary font-bold bg-primary/5' : 'text-text-main'}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Inline Review Box (YouTube Style) */}
        <div className="mb-10 flex gap-4 rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all focus-within:border-primary/50 focus-within:shadow-[0_0_20px_rgba(255,87,34,0.1)] relative" ref={loginPromptRef}>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-background border-2 border-primary/30 overflow-hidden shadow-[0_0_10px_rgba(255,87,34,0.2)]">
            <img
              src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'Guest'}&backgroundColor=1A1A2E`}
              alt={isLoggedIn ? "Current User" : "Guest"}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex-1 relative">
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              onFocus={(e) => {
                if (!isLoggedIn) {
                  e.target.blur();
                  setShowLoginPrompt(true);
                } else {
                  setIsReviewFocused(true);
                }
              }}
              readOnly={!isLoggedIn}
              placeholder="Write a review..."
              className="w-full resize-none bg-transparent text-text-main placeholder-text-muted outline-none min-h-[48px] pt-3 transition-all"
              rows={isReviewFocused || reviewText ? 3 : 1}
            />
            
            {showLoginPrompt && !isLoggedIn && (
              <div className="absolute top-full left-0 mt-2 w-full sm:w-80 rounded-xl border border-border bg-surface shadow-2xl backdrop-blur-xl z-20 p-5 animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-white font-bold">Want to join the conversation?</h4>
                  <button onClick={() => setShowLoginPrompt(false)} className="text-text-muted hover:text-white transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm text-text-muted mb-4">Log in to post a review and rate this game.</p>
                <button 
                  onClick={() => navigate('/login')}
                  className="inline-block rounded-full bg-primary px-6 py-2 text-sm font-bold text-white shadow-[0_0_15px_rgba(255,87,34,0.4)] transition-all hover:bg-primary-hover hover:shadow-[0_0_25px_rgba(255,87,34,0.6)] cursor-pointer"
                >
                  Log In
                </button>
              </div>
            )}

            {isLoggedIn && (isReviewFocused || reviewText.length > 0) && (
              <div className="mt-3 flex flex-col gap-4 border-t border-border/50 pt-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-text-muted">Platform:</span>
                    <select
                      value={reviewPlatform}
                      onChange={(e) => setReviewPlatform(e.target.value)}
                      className="bg-background border border-border rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
                    >
                      <option value="" disabled>Select platform</option>
                      {game.platforms.map((p: any) => (
                        <option key={p.name} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-text-muted">Rating:</span>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setReviewRating(i + 1)}
                          className="p-0.5 transition-transform hover:scale-125 focus:outline-none"
                        >
                          <Star className={`h-4 w-4 transition-all ${i < reviewRating ? 'fill-primary text-primary' : 'fill-surface text-border'}`} />
                        </button>
                      ))}
                    </div>
                    {reviewRating > 0 && <span className="text-sm font-bold text-primary">{reviewRating}/10</span>}
                  </div>
                </div>
                <div className="flex gap-3 w-full justify-end">
                  <button
                    onClick={() => {
                      setIsReviewFocused(false);
                      setReviewText('');
                      setReviewPlatform('');
                      setReviewRating(0);
                    }}
                    className="rounded-full px-4 py-2 text-sm font-medium text-text-muted hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePostReview}
                    disabled={!reviewText.trim() || !reviewPlatform}
                    className="rounded-full bg-primary px-6 py-2 text-sm font-bold text-white shadow-[0_0_10px_rgba(255,87,34,0.3)] transition-all hover:bg-primary-hover hover:shadow-[0_0_20px_rgba(255,87,34,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-[0_0_10px_rgba(255,87,34,0.3)]"
                  >
                    Post Review
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Review List */}
        <div className="grid gap-6">
          {reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border border-border border-dashed rounded-2xl bg-surface/30">
              <MessageSquare className="h-10 w-10 text-text-muted mb-3 opacity-50" />
              <h3 className="text-lg font-bold text-white mb-1">No reviews yet</h3>
              <p className="text-sm text-text-muted">Be the first to review this game on {reviewFilterPlatform}!</p>
            </div>
          ) : (
            reviews.map((review, index) => (
              <div 
                key={review._id} 
                className={`relative rounded-2xl border bg-surface p-6 transition-all hover:border-border/80 ${
                  index === 0 && reviewFilterPlatform === 'All Platforms' ? 'border-primary/40 shadow-[0_0_20px_rgba(255,87,34,0.1)]' : 'border-border'
                }`}
              >
                {index === 0 && reviewFilterPlatform === 'All Platforms' && (
                  <div className="absolute -top-3 right-6 rounded-full bg-primary px-3 py-1 text-xs font-bold text-white shadow-[0_0_10px_rgba(255,87,34,0.4)]">
                    Top Review
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      onClick={() => {
                        window.scrollTo(0, 0);
                        navigate(`/users/${review.author.username}`);
                      }}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-background border border-border cursor-pointer hover:border-primary transition-colors overflow-hidden"
                    >
                      <img
                        src={review.author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.author.username}&backgroundColor=1A1A2E`}
                        alt={review.author.username}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="font-medium text-white flex items-center gap-2">
                        <span
                          onClick={() => {
                            window.scrollTo(0, 0);
                            navigate(`/users/${review.author.username}`);
                          }}
                          className="cursor-pointer hover:text-primary hover:underline transition-colors"
                        >
                          {review.author.username}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
                          Played on: {review.platform}
                        </span>
                      </div>
                      <div className="text-xs text-text-muted">{new Date(review.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  
                  {/* Simplified Star Rating */}
                  <div className="flex shrink-0 items-center gap-1.5 bg-background/50 px-3 py-1.5 rounded-full border border-border">
                    <span className="font-mono font-bold text-white">{review.rating}</span>
                    <Star className="h-4 w-4 fill-primary text-primary drop-shadow-[0_0_8px_rgba(255,87,34,0.8)]" />
                  </div>
                </div>
                
                <p className="text-text-muted leading-relaxed mb-6">
                  {review.content}
                </p>
                
                <div className="flex items-center justify-start gap-3 pt-4 border-t border-border/50 relative">
                  <button
                    onClick={() => handleLike(review._id)}
                    className={`group flex items-center gap-2 rounded-full bg-background px-4 py-2 text-sm font-medium border transition-all cursor-pointer hover:border-primary hover:text-primary hover:shadow-[0_0_15px_rgba(255,87,34,0.4)] ${
                      userVotes[review._id] === 'upvote'
                        ? 'border-primary text-primary shadow-[0_0_10px_rgba(255,87,34,0.15)]'
                        : 'border-border text-text-muted'
                    }`}
                  >
                    <ThumbsUp className={`h-4 w-4 transition-transform ${userVotes[review._id] === 'upvote' ? 'scale-110' : 'group-hover:-translate-y-0.5'}`} />
                    <span>Like {review.upvotes}</span>
                  </button>
                  <button
                    onClick={() => handleDislike(review._id)}
                    className={`group flex items-center gap-2 rounded-full bg-background px-4 py-2 text-sm font-medium border transition-all cursor-pointer hover:border-primary hover:text-primary hover:shadow-[0_0_15px_rgba(255,87,34,0.4)] ${
                      userVotes[review._id] === 'downvote'
                        ? 'border-primary text-primary shadow-[0_0_10px_rgba(255,87,34,0.15)]'
                        : 'border-border text-text-muted'
                    }`}
                  >
                    <ThumbsDown className={`h-4 w-4 transition-transform ${userVotes[review._id] === 'downvote' ? 'scale-110' : 'group-hover:translate-y-0.5'}`} />
                    <span>Dislike {review.downvotes}</span>
                  </button>
                  
                  {showReviewActionPrompt === review._id && !isLoggedIn && (
                    <div className="absolute bottom-full left-0 mb-2 w-full sm:w-80 rounded-xl border border-border bg-surface shadow-2xl backdrop-blur-xl z-20 p-5 animate-in fade-in slide-in-from-bottom-2">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-white font-bold">Want to join the conversation?</h4>
                        <button onClick={() => setShowReviewActionPrompt(null)} className="text-text-muted hover:text-white transition-colors cursor-pointer">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-sm text-text-muted mb-4">Log in to like or dislike reviews.</p>
                      <button 
                        onClick={() => navigate('/login')}
                        className="inline-block rounded-full bg-primary px-6 py-2 text-sm font-bold text-white shadow-[0_0_15px_rgba(255,87,34,0.4)] transition-all hover:bg-primary-hover hover:shadow-[0_0_25px_rgba(255,87,34,0.6)] cursor-pointer"
                      >
                        Log In
                      </button>
                    </div>
                  )}
                  
                  {/* Authorization: Only show delete button to the author */}
                  {user && review.author._id === user._id && (
                    <button 
                      onClick={() => handleDeleteReview(review._id)}
                      className="group ml-auto flex items-center gap-2 rounded-full bg-background px-4 py-2 text-sm font-medium text-text-muted border border-border transition-all cursor-pointer hover:border-primary/50 hover:text-primary hover:shadow-[0_0_10px_rgba(255,87,34,0.15)]"
                      title="Delete Review"
                    >
                      <Trash2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* AI Community Analysis */}
        {aiAnalysisLoading ? (
          <div className="mt-10 flex items-center gap-3 text-text-muted">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-surface border-t-primary"></div>
            <span className="text-sm">AI is analyzing community reviews...</span>
          </div>
        ) : aiAnalysis ? (
          <div className="mt-10 rounded-2xl border border-primary/20 bg-surface p-6 shadow-[0_0_20px_rgba(255,87,34,0.05)]">
            <div className="flex items-center gap-2 mb-4">
              <Star className="h-5 w-5 text-primary" />
              <h3 className="font-display text-lg font-bold text-white">AI Community Analysis</h3>
              <span className={`ml-2 rounded-full px-3 py-0.5 text-xs font-bold uppercase ${
                aiAnalysis.sentiment === 'positive' ? 'bg-green-500/10 text-green-400 border border-green-500/30' :
                aiAnalysis.sentiment === 'negative' ? 'bg-red-500/10 text-red-400 border border-red-500/30' :
                'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
              }`}>
                {aiAnalysis.sentiment}
              </span>
            </div>
            <p className="text-text-muted leading-relaxed mb-4">{aiAnalysis.summary}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {aiAnalysis.pros?.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-green-400 mb-2">Pros</h4>
                  <ul className="space-y-1">
                    {aiAnalysis.pros.map((pro: string, i: number) => (
                      <li key={i} className="text-sm text-text-muted flex items-start gap-2">
                        <span className="text-green-400 mt-0.5">+</span> {pro}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {aiAnalysis.cons?.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-red-400 mb-2">Cons</h4>
                  <ul className="space-y-1">
                    {aiAnalysis.cons.map((con: string, i: number) => (
                      <li key={i} className="text-sm text-text-muted flex items-start gap-2">
                        <span className="text-red-400 mt-0.5">-</span> {con}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* Add to Library Modal */}
      {isLibraryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-[0_0_40px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsLibraryModalOpen(false)} 
              className="absolute right-4 top-4 rounded-full p-1 text-text-muted hover:bg-background hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            
            <h3 className="font-display text-2xl font-bold text-white mb-1">Add to Library</h3>
            <p className="text-sm text-text-muted mb-6">
              Select your play status for <span className="text-primary font-medium">{game.title}</span>
            </p>
            
            <div className="grid grid-cols-2 gap-3 mb-8">
              {[
                { id: 'Played', label: 'Played', icon: CheckCircle2 },
                { id: 'Playing', label: 'Playing', icon: PlayCircle },
                { id: 'Plan to Play', label: 'Plan to Play', icon: Clock },
                { id: 'Dropped', label: 'Dropped', icon: XCircle },
              ].map((status) => {
                const Icon = status.icon;
                const isActive = playStatus === status.id;
                return (
                  <button
                    key={status.id}
                    onClick={() => setPlayStatus(status.id)}
                    className={`flex flex-col items-center justify-center gap-3 rounded-xl border p-4 transition-all ${
                      isActive 
                        ? 'border-primary bg-primary/10 text-primary shadow-[0_0_15px_rgba(255,87,34,0.15)]' 
                        : 'border-border bg-background text-text-muted hover:border-primary/50 hover:text-white'
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-sm font-medium">{status.label}</span>
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={async () => {
                if (!id || !playStatus) return;
                try {
                  const entry = await addToLibrary(id, playStatus);
                  setLibraryEntryId(entry._id);
                  setIsLibraryModalOpen(false);
                } catch (err) {
                  console.error('Failed to add to library:', err);
                }
              }}
              disabled={!playStatus}
              className="w-full rounded-full bg-primary py-3.5 font-bold text-white shadow-[0_0_15px_rgba(255,87,34,0.3)] transition-all hover:bg-primary-hover hover:shadow-[0_0_25px_rgba(255,87,34,0.5)] disabled:opacity-50 disabled:hover:shadow-[0_0_15px_rgba(255,87,34,0.3)] disabled:cursor-not-allowed"
            >
              Save to Library
            </button>
          </div>
        </div>
      )}

      {/* Rate Game Modal */}
      {isRatingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-[420px] rounded-2xl border border-border bg-surface p-6 shadow-[0_0_40px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsRatingModalOpen(false)} 
              className="absolute right-4 top-4 rounded-full p-1 text-text-muted hover:bg-background hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            
            <h3 className="font-display text-2xl font-bold text-white mb-1 text-center">Rate Game</h3>
            <p className="text-sm text-text-muted mb-6 text-center">
              What would you rate <span className="text-primary font-medium">{game.title}</span>?
            </p>
            
            {/* Platform Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-text-muted mb-2">Select Platform</label>
              <select 
                value={ratingPlatform}
                onChange={(e) => setRatingPlatform(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary/50 transition-colors"
              >
                <option value="" disabled>Choose a platform...</option>
                {game.platforms.map((p: any) => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Interactive Star Rating */}
            <div className="mb-8 flex flex-col items-center justify-center">
              <div className="flex items-center justify-center gap-0.5 sm:gap-1 w-full max-w-full">
                {Array.from({ length: 10 }).map((_, i) => {
                  const starValue = i + 1;
                  const isActive = starValue <= (hoveredRating || rating);
                  return (
                    <button
                      key={i}
                      onMouseEnter={() => setHoveredRating(starValue)}
                      onMouseLeave={() => setHoveredRating(0)}
                      onClick={() => setRating(starValue)}
                      className="p-0.5 sm:p-1 transition-transform hover:scale-125 focus:outline-none"
                    >
                      <Star 
                        className={`h-5 w-5 sm:h-7 sm:w-7 transition-all duration-200 ${
                          isActive 
                            ? 'fill-primary text-primary drop-shadow-[0_0_10px_rgba(255,87,34,0.8)]' 
                            : 'fill-surface text-border'
                        }`} 
                      />
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 font-mono text-3xl font-bold text-primary">
                {hoveredRating || rating || 0} <span className="text-lg text-text-muted">/ 10</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={async () => {
                  if (!id || rating === 0 || !ratingPlatform) return;
                  try {
                    await rateGameAPI(id, rating, ratingPlatform);
                    setUserRating(rating);
                    setIsRatingModalOpen(false);
                  } catch (err) {
                    console.error('Failed to rate game:', err);
                  }
                }}
                disabled={rating === 0 || !ratingPlatform}
                className="w-full rounded-full bg-primary py-3.5 font-bold text-white shadow-[0_0_15px_rgba(255,87,34,0.3)] transition-all hover:bg-primary-hover hover:shadow-[0_0_25px_rgba(255,87,34,0.5)] disabled:opacity-50 disabled:hover:shadow-[0_0_15px_rgba(255,87,34,0.3)] disabled:cursor-not-allowed"
              >
                {userRating !== null ? 'Update Rating' : 'Submit Rating'}
              </button>
              
              {userRating !== null && (
                <button
                  onClick={async () => {
                    if (!id) return;
                    try {
                      await deleteMyRating(id);
                      setUserRating(null);
                      setRating(0);
                      setRatingPlatform('');
                      setIsRatingModalOpen(false);
                    } catch (err) {
                      console.error('Failed to remove rating:', err);
                    }
                  }}
                  className="w-full rounded-full border border-border bg-transparent py-3.5 font-bold text-text-muted transition-all hover:border-red-500 hover:text-red-500"
                >
                  Remove Rating
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Rating Login Prompt Modal */}
      {showRatingPrompt && !isLoggedIn && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowRatingPrompt(false)}
        >
          <div 
            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-[#1a1a1a] border-t-4 border-t-primary shadow-[0_10px_40px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowRatingPrompt(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="p-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-display text-2xl font-bold text-white">Do you want to rate this game?</h3>
              <p className="mb-8 text-text-muted">
                Log in to submit your score and influence the PixelCritic rating.
              </p>
              
              <button 
                onClick={() => navigate('/login')}
                className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-6 py-3 font-bold text-white shadow-[0_0_15px_rgba(255,87,34,0.4)] transition-all hover:bg-primary-hover hover:shadow-[0_0_25px_rgba(255,87,34,0.6)] cursor-pointer"
              >
                Log In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Library Login Prompt Modal */}
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
              className="absolute top-4 right-4 text-text-muted hover:text-white transition-colors cursor-pointer"
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
              
              <button 
                onClick={() => navigate('/login')}
                className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-6 py-3 font-bold text-white shadow-[0_0_15px_rgba(255,87,34,0.4)] transition-all hover:bg-primary-hover hover:shadow-[0_0_25px_rgba(255,87,34,0.6)] cursor-pointer"
              >
                Log In
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
