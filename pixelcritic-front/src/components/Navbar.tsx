import { Search, Menu, User, LogIn, Gamepad2, LogOut, ChevronDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/UserContext';
import { searchGames as searchGamesAPI } from '../services/gameService';
import { searchUsers as searchUsersAPI } from '../services/userService';

export default function Navbar() {
  const { user, isLoggedIn, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchCategory, setSearchCategory] = useState('All');
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const userAvatar = user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'Guest'}&backgroundColor=1A1A2E`;
  const userName = user?.username || 'Guest';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showGames = searchCategory === 'All' || searchCategory === 'Games';
  const showUsers = searchCategory === 'All' || searchCategory === 'Users';

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [userResults, setUserResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      setUserResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const promises: Promise<any>[] = [];
        if (showGames) promises.push(searchGamesAPI(searchQuery, 6));
        else promises.push(Promise.resolve([]));
        if (showUsers) promises.push(searchUsersAPI(searchQuery));
        else promises.push(Promise.resolve([]));

        const [games, users] = await Promise.all(promises);
        setSearchResults(games);
        setUserResults(users);
      } catch {
        setSearchResults([]);
        setUserResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, showGames, showUsers]);

  const filteredGames = searchResults;
  const filteredUsers = userResults;
  const hasResults = filteredGames.length > 0 || filteredUsers.length > 0;

  let emptyStateMessage = 'No results found';
  if (searchCategory === 'Games') emptyStateMessage = 'No games found';
  if (searchCategory === 'Users') emptyStateMessage = 'No users found';

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo */}
        <div className="flex items-center">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface border border-primary/30 shadow-[0_0_15px_rgba(255,87,34,0.3)] group-hover:shadow-[0_0_25px_rgba(255,87,34,0.5)] transition-all duration-300">
              <span className="font-display text-xl font-bold text-primary">PC</span>
            </div>
            <span className="hidden font-display text-xl font-bold tracking-tight sm:block">
              PixelCritic
            </span>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="hidden flex-1 items-center justify-center px-8 md:flex" ref={searchRef}>
          <div className="group relative w-full max-w-md">
            <div className="flex items-center w-full rounded-full border border-[#374151] bg-[#1f2937] transition-all focus-within:border-primary focus-within:ring-1 focus-within:ring-primary focus-within:shadow-[0_0_15px_rgba(255,87,34,0.15)]">
              {/* Category Dropdown */}
              <div className="relative flex items-center h-full" ref={categoryRef}>
                <button
                  type="button"
                  onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                  className="flex items-center gap-2 bg-transparent text-text-muted hover:text-[#e5e7eb] text-sm font-medium py-2 pl-4 pr-3 outline-none cursor-pointer h-full rounded-l-full hover:bg-[#374151] transition-colors"
                >
                  {searchCategory}
                  <ChevronDown className="h-4 w-4" />
                </button>
                
                {isCategoryOpen && (
                  <div className="absolute top-full left-0 mt-2 w-32 bg-[#1f2937] border border-[#374151] rounded-lg shadow-xl overflow-hidden z-50">
                    {['All', 'Games', 'Users'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setSearchCategory(cat);
                          setIsCategoryOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-[#e5e7eb] cursor-pointer hover:bg-[#374151] hover:text-[#ff5500] hover:drop-shadow-[0_0_8px_rgba(255,85,0,0.8)] transition-all"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="w-[1px] h-[20px] bg-[#4b5563] mx-2 shrink-0"></div>

              {/* Text Input */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                className="flex-1 bg-transparent py-2 pl-2 pr-10 text-sm text-text-main placeholder-text-muted outline-none"
                placeholder="Search games or users..."
              />

              {/* Search Icon */}
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                <Search className="h-4 w-4 text-text-muted group-focus-within:text-primary transition-colors" />
              </div>
            </div>
            
            {/* Search Dropdown */}
            {isSearchOpen && searchQuery.length > 0 && (
              <div className="absolute top-full mt-2 w-full overflow-hidden rounded-xl border border-border bg-surface shadow-2xl backdrop-blur-xl">
                {!hasResults ? (
                  <div className="p-4 text-center text-sm text-text-muted">{emptyStateMessage}</div>
                ) : (
                  <div className="max-h-[60vh] overflow-y-auto py-2">
                    {filteredGames.length > 0 && (
                      <div className="mb-2">
                        <div className="px-4 py-1 text-xs font-bold uppercase tracking-wider text-text-muted">Games</div>
                        {filteredGames.map(game => (
                          <button
                            key={game._id}
                            onClick={() => handleNavigate(`/games/${game._id}`)}
                            className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-surface-hover hover:text-primary transition-colors"
                          >
                            <Gamepad2 className="h-4 w-4 text-primary/70" />
                            {game.title}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {filteredUsers.length > 0 && (
                      <div>
                        <div className="px-4 py-1 text-xs font-bold uppercase tracking-wider text-text-muted">Users</div>
                        {filteredUsers.map(user => (
                          <button
                            key={user.username}
                            onClick={() => handleNavigate(`/users/${user.username}`)}
                            className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-surface-hover hover:text-primary transition-colors"
                          >
                            <User className="h-4 w-4 text-primary/70" />
                            {user.username}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button className="md:hidden p-2 text-text-muted hover:text-primary transition-colors">
            <Search className="h-5 w-5" />
          </button>
          
          <div className="hidden items-center gap-3 sm:flex">
            {isLoggedIn ? (
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-3 rounded-full border border-border bg-surface py-1.5 pl-1.5 pr-4 transition-all hover:border-primary/50 hover:bg-surface-hover hover:shadow-[0_0_15px_rgba(255,87,34,0.15)] focus:outline-none"
                >
                  <div className="h-8 w-8 overflow-hidden rounded-full bg-background border border-primary/30">
                    <img 
                      src={userAvatar} 
                      alt={userName}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span className="text-sm font-bold text-white">{userName}</span>
                </button>

                {/* Profile Dropdown */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-border bg-surface shadow-2xl backdrop-blur-xl z-50">
                    <div className="py-1">
                      <Link
                        to={`/users/${userName}`}
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-text-main hover:bg-surface-hover hover:text-primary transition-colors"
                      >
                        <User className="h-4 w-4" />
                        My Profile
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setIsProfileMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-text-main hover:bg-surface-hover hover:text-primary transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Log Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-text-main transition-colors hover:bg-surface-hover hover:text-primary"
                >
                  <LogIn className="h-4 w-4" />
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white shadow-[0_0_15px_rgba(255,87,34,0.4)] transition-all hover:bg-primary-hover hover:shadow-[0_0_25px_rgba(255,87,34,0.6)]"
                >
                  <User className="h-4 w-4" />
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="sm:hidden p-2 text-text-muted hover:text-primary transition-colors">
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>
    </nav>
  );
}
