import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { User, Star, Gamepad2, Calendar, MessageSquare, CheckCircle2, PlayCircle, Clock, XCircle, Compass, ThumbsUp, ThumbsDown, Users, X, Edit2, Camera } from 'lucide-react';
import { useAuth } from '../context/UserContext';
import { getUserProfile, updateProfile } from '../services/userService';
import { followUser, unfollowUser, checkFollow, getFollowers, getFollowing, removeFollower } from '../services/followService';
import { getLibrary, removeFromLibrary } from '../services/libraryService';
import { getReviewsByUser } from '../services/reviewService';
import { getRatingsByUser } from '../services/ratingService';
import { generateAvatars as generateAIAvatars } from '../services/aiService';

type Tab = 'played' | 'playing' | 'plan' | 'dropped' | 'reviews' | 'ratings' | 'followers' | 'following';

const STATUS_MAP: Record<string, string> = {
  played: 'Played',
  playing: 'Playing',
  plan: 'Plan to Play',
  dropped: 'Dropped',
};

const DEFAULT_AVATARS = [
  { id: 'img1', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=controller&backgroundColor=1A1A2E', label: 'Retro Pixel Art' },
  { id: 'img2', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=cyberpunk&backgroundColor=1A1A2E', label: 'Neon-Cyberpunk' },
  { id: 'img3', url: 'https://api.dicebear.com/7.x/shapes/svg?seed=minimalist&backgroundColor=1A1A2E', label: 'Minimalist Synth' },
  { id: 'img4', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=futuristic&backgroundColor=1A1A2E', label: 'Futuristic Gamer' },
];

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'played', label: 'Played', icon: CheckCircle2 },
  { id: 'playing', label: 'Playing', icon: PlayCircle },
  { id: 'plan', label: 'Plan to Play', icon: Clock },
  { id: 'dropped', label: 'Dropped', icon: XCircle },
  { id: 'reviews', label: 'Reviews', icon: MessageSquare },
  { id: 'ratings', label: 'Ratings', icon: Star },
  { id: 'followers', label: 'Followers', icon: Users },
  { id: 'following', label: 'Following', icon: Users },
];

export default function PublicProfile() {
  const { isLoggedIn, user: authUser, updateUser } = useAuth();
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [library, setLibrary] = useState<any[]>([]);
  const [userReviews, setUserReviews] = useState<any[]>([]);
  const [userRatings, setUserRatings] = useState<any[]>([]);
  const [followersList, setFollowersList] = useState<any[]>([]);
  const [followingList, setFollowingList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('played');
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [showFollowPrompt, setShowFollowPrompt] = useState(false);

  // Determine the username to display — from URL param or from logged in user
  const displayUsername = username || authUser?.username;
  const isOwnProfile = isLoggedIn && authUser?.username === displayUsername;

  // Bio editing state
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState('');
  const [bioSaving, setBioSaving] = useState(false);

  // AI Profile Picture Generator State
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState(DEFAULT_AVATARS);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Fetch profile data
  useEffect(() => {
    const fetchData = async () => {
      if (!displayUsername) return;
      setIsLoading(true);
      try {
        const profileData = await getUserProfile(displayUsername);
        setProfile(profileData);
        setFollowerCount(profileData.followers);
        setCurrentAvatar(profileData.avatar);

        // Fetch library, reviews, ratings, followers, following in parallel
        const [libData, reviewsData, ratingsData, followersData, followingData] = await Promise.all([
          getLibrary(profileData._id),
          getReviewsByUser(profileData._id),
          getRatingsByUser(profileData._id),
          getFollowers(profileData._id),
          getFollowing(profileData._id),
        ]);

        setLibrary(libData);
        setUserReviews(reviewsData.data || reviewsData);
        setUserRatings(ratingsData);
        setFollowersList(followersData);
        setFollowingList(followingData);

        // Check if current user follows this profile
        if (isLoggedIn && !isOwnProfile) {
          try {
            const result = await checkFollow(profileData._id);
            setIsFollowing(result.following);
          } catch {
            // Not logged in or error, ignore
          }
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        setProfile(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [displayUsername, isLoggedIn]);

  const handleFollowToggle = async () => {
    if (!isLoggedIn) {
      setShowFollowPrompt(true);
      return;
    }
    if (!profile) return;
    try {
      if (isFollowing) {
        const result = await unfollowUser(profile._id);
        setFollowerCount(result.followerCount);
        setIsFollowing(false);
      } else {
        const result = await followUser(profile._id);
        setFollowerCount(result.followerCount);
        setIsFollowing(true);
      }
    } catch (err) {
      console.error('Failed to toggle follow:', err);
    }
  };

  const handleGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    setGenerateError(null);
    setSelectedImage(null);
    try {
      const result = await generateAIAvatars(aiPrompt.trim());
      if (result.avatars && result.avatars.length > 0) {
        // Ensure avatar URLs have the full backend origin for <img> tags
        const BACKEND_URL = 'https://pixelcritic-backend.onrender.com';
        const avatarsWithFullUrl = result.avatars.map((a: any) => ({
          ...a,
          url: a.url.startsWith('/') ? `${BACKEND_URL}${a.url}` : a.url,
        }));
        setGeneratedImages(avatarsWithFullUrl);
      } else {
        setGenerateError(result.message || 'Failed to generate avatars. Please try again.');
      }
    } catch (err) {
      console.error('Avatar generation failed:', err);
      setGenerateError('Failed to generate avatars. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveBio = async () => {
    setBioSaving(true);
    try {
      await updateProfile({ bio: bioText.trim() });
      setProfile((prev: any) => prev ? { ...prev, bio: bioText.trim() } : prev);
      setIsEditingBio(false);
    } catch (err) {
      console.error('Failed to save bio:', err);
    } finally {
      setBioSaving(false);
    }
  };

  const handleSaveAvatar = async () => {
    if (!selectedImage) return;
    try {
      await updateProfile({ avatar: selectedImage });
      setCurrentAvatar(selectedImage);
      updateUser({ avatar: selectedImage });
      setShowAIGenerator(false);
    } catch (err) {
      console.error('Failed to save avatar:', err);
    }
  };

  const handleUnfollow = async (userId: string) => {
    try {
      await unfollowUser(userId);
      setFollowingList(prev => prev.filter(u => u._id !== userId));
    } catch (err) {
      console.error('Failed to unfollow:', err);
    }
  };

  const handleRemoveFollower = async (userId: string) => {
    try {
      await removeFollower(userId);
      setFollowersList(prev => prev.filter(u => u._id !== userId));
      setFollowerCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to remove follower:', err);
    }
  };

  // Get library entries by status
  const getLibraryByStatus = (status: string) => {
    return library.filter((entry: any) => entry.status === STATUS_MAP[status]);
  };

  const handleRemoveFromLibrary = async (e: React.MouseEvent, entryId: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await removeFromLibrary(entryId);
      setLibrary(prev => prev.filter((entry: any) => entry._id !== entryId));
    } catch (err) {
      console.error('Failed to remove from library:', err);
    }
  };

  // Tab counts
  const getTabCount = (tabId: string) => {
    if (tabId === 'reviews') return userReviews.length;
    if (tabId === 'ratings') return userRatings.length;
    if (tabId === 'followers') return followersList.length;
    if (tabId === 'following') return followingList.length;
    return getLibraryByStatus(tabId).length;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-surface border-t-primary"></div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background text-text-main pb-20">
      {/* Top Section / Profile Header */}
      <div className="relative border-b border-border bg-surface/50 pt-12 pb-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,87,34,0.05),transparent_70%)]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">

            {/* Avatar */}
            <div className="relative group">
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-background border-2 border-primary/50 shadow-[0_0_30px_rgba(255,87,34,0.3)] overflow-hidden relative">
                <img
                  src={currentAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}&backgroundColor=1A1A2E`}
                  alt={profile.username}
                  className="h-full w-full object-cover transition-opacity duration-300 group-hover:opacity-50"
                />
                {isOwnProfile && (
                  <button
                    onClick={() => setShowAIGenerator(true)}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  >
                    <Edit2 className="h-8 w-8 text-white drop-shadow-[0_0_10px_rgba(255,87,34,0.8)]" />
                  </button>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 rounded-full bg-primary px-3 py-1 text-xs font-bold text-white shadow-[0_0_10px_rgba(255,87,34,0.5)] border border-background">
                LVL {Math.floor(profile.stats.totalGames / 10) + 1}
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4 mb-2">
                <h1 className="font-display text-4xl font-extrabold tracking-tight text-white">
                  {profile.username}
                </h1>
                {!isOwnProfile && (
                  <button
                    onClick={handleFollowToggle}
                    className={`px-6 py-2 rounded-full font-bold text-sm transition-all duration-300 ${
                      isFollowing
                        ? 'bg-transparent border border-primary text-primary hover:bg-primary/10'
                        : 'bg-primary text-white shadow-[0_0_15px_rgba(255,87,34,0.4)] hover:shadow-[0_0_25px_rgba(255,87,34,0.6)] hover:bg-primary-hover'
                    }`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>
              {isOwnProfile && isEditingBio ? (
                <div className="max-w-2xl mb-6">
                  <textarea
                    value={bioText}
                    onChange={(e) => setBioText(e.target.value)}
                    maxLength={500}
                    rows={3}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-text-main text-lg placeholder-text-muted/50 outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                    placeholder="Write something about yourself..."
                    autoFocus
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-text-muted">{bioText.length}/500</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setIsEditingBio(false); setBioText(profile.bio || ''); }}
                        className="px-4 py-1.5 text-sm font-medium text-text-muted hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveBio}
                        disabled={bioSaving}
                        className="px-4 py-1.5 text-sm font-bold rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors disabled:opacity-50"
                      >
                        {bioSaving ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p
                  className={`max-w-2xl mb-6 text-lg ${isOwnProfile ? 'cursor-pointer hover:text-white transition-colors group/bio' : ''} ${profile.bio ? 'text-text-muted' : 'text-text-muted/50 italic'}`}
                  onClick={() => { if (isOwnProfile) { setBioText(profile.bio || ''); setIsEditingBio(true); } }}
                >
                  {profile.bio || (isOwnProfile ? 'Click to write a bio...' : "This user hasn't written a bio yet.")}
                  {isOwnProfile && <Edit2 className="inline h-4 w-4 ml-2 opacity-0 group-hover/bio:opacity-100 transition-opacity" />}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-6">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-5 w-5 text-primary" />
                  <span className="font-bold text-white">{followerCount}</span>
                  <span className="text-text-muted">Followers</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Gamepad2 className="h-5 w-5 text-primary" />
                  <span className="font-bold text-white">{profile.stats.totalGames}</span>
                  <span className="text-text-muted">Games</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <span className="font-bold text-white">{profile.stats.totalReviews}</span>
                  <span className="text-text-muted">Reviews</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-5 w-5 text-text-muted" />
                  <span className="text-text-muted">Joined {new Date(profile.createdAt).getFullYear()}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Library Section */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">

        {/* Tabbed Navigation */}
        <div className="flex overflow-x-auto hide-scrollbar border-b border-border mb-8">
          <div className="flex space-x-8 min-w-max px-2">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group relative flex items-center gap-2 pb-4 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-primary'
                      : 'text-text-muted hover:text-white'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-primary drop-shadow-[0_0_8px_rgba(255,87,34,0.8)]' : 'text-text-muted group-hover:text-white'}`} />
                  {tab.label}
                  <span className="ml-1.5 rounded-full bg-surface-hover px-2 py-0.5 text-xs text-text-muted">
                    {getTabCount(tab.id)}
                  </span>

                  {/* Active Indicator */}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_-2px_10px_rgba(255,87,34,0.8)]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'followers' || activeTab === 'following' ? (
          (activeTab === 'followers' ? followersList : followingList).length > 0 ? (
            <div className="flex flex-col">
              {(activeTab === 'followers' ? followersList : followingList).map((person: any) => (
                <div
                  key={person._id}
                  className="flex items-center justify-between px-4 py-3 border-b border-[#374151] w-full hover:bg-surface-hover transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={person.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${person.username}&backgroundColor=1A1A2E`}
                      alt={person.username}
                      className="w-10 h-10 rounded-full object-cover border border-border cursor-pointer hover:border-primary transition-colors"
                      onClick={() => { navigate(`/users/${person.username}`); window.scrollTo(0, 0); }}
                    />
                    <span
                      className="font-bold text-white cursor-pointer hover:text-primary transition-colors"
                      onClick={() => { navigate(`/users/${person.username}`); window.scrollTo(0, 0); }}
                    >
                      {person.username}
                    </span>
                  </div>
                  {activeTab === 'following' && isOwnProfile && (
                    <button
                      onClick={() => handleUnfollow(person._id)}
                      className="px-4 py-1.5 text-xs font-bold rounded-full border border-border text-text-muted hover:border-red-500 hover:text-red-500 hover:drop-shadow-[0_0_5px_rgba(239,68,68,0.8)] transition-colors"
                    >
                      Unfollow
                    </button>
                  )}
                  {activeTab === 'followers' && isOwnProfile && (
                    <button
                      onClick={() => handleRemoveFollower(person._id)}
                      className="px-4 py-1.5 text-xs font-bold rounded-full border border-border text-text-muted hover:border-red-500 hover:text-red-500 hover:drop-shadow-[0_0_5px_rgba(239,68,68,0.8)] transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-dashed border-border rounded-2xl bg-surface/30">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface border border-border mb-4">
                <Users className="h-8 w-8 text-text-muted" />
              </div>
              <h3 className="font-display text-xl font-bold text-white mb-2">
                {activeTab === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
              </h3>
              <p className="text-text-muted max-w-sm mb-8">
                {activeTab === 'followers' ? 'Be the first to follow this user!' : 'Explore the community to find people to follow.'}
              </p>
            </div>
          )
        ) : activeTab === 'ratings' ? (
          userRatings.length > 0 ? (
            <div className="flex flex-col">
              {userRatings.map((rating: any) => (
                <Link
                  key={rating._id}
                  to={`/games/${rating.game?._id}`}
                  className="flex justify-between items-center px-4 py-3 border-b border-[#374151] hover:bg-gray-800 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={rating.game?.coverImage || `https://picsum.photos/seed/${rating.game?._id}/600/900`}
                      alt={rating.game?.title}
                      className="w-12 h-12 rounded object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <span className="font-bold text-white group-hover:text-primary transition-colors">{rating.game?.title}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-background/50 px-3 py-1.5 rounded-full border border-primary/30 shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                    <span className="font-mono font-bold text-white">{rating.score}</span>
                    <Star className="h-4 w-4 fill-primary text-primary drop-shadow-[0_0_8px_rgba(255,87,34,0.8)]" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-dashed border-border rounded-2xl bg-surface/30">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface border border-border mb-4">
                <Star className="h-8 w-8 text-text-muted" />
              </div>
              <h3 className="font-display text-xl font-bold text-white mb-2">No games rated yet.</h3>
              <p className="text-text-muted max-w-sm mb-8">
                Start rating games to build your profile.
              </p>
              <button
                onClick={() => navigate('/explore')}
                className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-bold text-white shadow-[0_0_15px_rgba(255,87,34,0.3)] transition-all hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-[0_0_25px_rgba(255,87,34,0.5)] cursor-pointer"
              >
                <Compass className="h-5 w-5" />
                Discover Games
              </button>
            </div>
          )
        ) : activeTab === 'reviews' ? (
          userReviews.length > 0 ? (
            <div className="flex flex-col gap-6">
              {userReviews.map((review: any) => (
                <div key={review._id} className="flex flex-col sm:flex-row rounded-2xl border border-border bg-surface overflow-hidden transition-all hover:border-primary/50 hover:shadow-[0_0_15px_rgba(255,87,34,0.3)]">
                  {/* Left Side: Thumbnail */}
                  <Link to={`/games/${review.game?._id}`} className="sm:w-32 md:w-40 shrink-0 bg-background">
                    <img
                      src={review.game?.coverImage || `https://picsum.photos/seed/${review.game?._id}/600/900`}
                      alt={review.game?.title}
                      className="h-full w-full object-cover aspect-[3/4] sm:aspect-auto"
                      referrerPolicy="no-referrer"
                    />
                  </Link>

                  {/* Right Side: Content */}
                  <div className="flex flex-col flex-1 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <Link to={`/games/${review.game?._id}`} className="font-display text-xl font-bold text-white hover:text-primary transition-colors">
                        {review.game?.title}
                      </Link>
                      <div className="flex items-center gap-1.5 bg-background/50 px-3 py-1.5 rounded-full border border-primary/30 shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                        <span className="font-mono font-bold text-white">{review.rating}</span>
                        <Star className="h-4 w-4 fill-primary text-primary drop-shadow-[0_0_8px_rgba(255,87,34,0.8)]" />
                      </div>
                    </div>

                    <p className="text-text-muted leading-relaxed mb-6 flex-1">
                      {review.content}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-border/50 mt-auto">
                      <div className="text-sm text-text-muted">
                        Posted on {new Date(review.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-text-muted">
                        <div className="flex items-center gap-1.5">
                          <ThumbsUp className="h-4 w-4" />
                          <span>{review.upvotes}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <ThumbsDown className="h-4 w-4" />
                          <span>{review.downvotes}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-dashed border-border rounded-2xl bg-surface/30">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface border border-border mb-4">
                <MessageSquare className="h-8 w-8 text-text-muted" />
              </div>
              <h3 className="font-display text-xl font-bold text-white mb-2">No reviews yet.</h3>
              <p className="text-text-muted max-w-sm mb-8">
                Share your thoughts and ratings with the PixelCritic community.
              </p>
              <button
                onClick={() => navigate('/explore')}
                className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-bold text-white shadow-[0_0_15px_rgba(255,87,34,0.3)] transition-all hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-[0_0_25px_rgba(255,87,34,0.5)] cursor-pointer"
              >
                <Compass className="h-5 w-5" />
                Explore Games
              </button>
            </div>
          )
        ) : getLibraryByStatus(activeTab).length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {getLibraryByStatus(activeTab).map((entry: any) => (
              <div key={entry._id} className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_8px_30px_rgba(255,87,34,0.15)]">
                {isOwnProfile && (
                  <button
                    onClick={(e) => handleRemoveFromLibrary(e, entry._id)}
                    className="absolute top-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 border border-border text-text-muted opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/80 hover:text-white hover:border-red-500"
                    title="Remove from library"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <Link to={`/games/${entry.game?._id}`} className="flex flex-col flex-1">
                  <div className="aspect-[3/4] w-full overflow-hidden bg-background">
                    <img
                      src={entry.game?.coverImage || `https://picsum.photos/seed/${entry.game?._id}/600/900`}
                      alt={entry.game?.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="p-3">
                    <h3 className="font-bold text-sm text-white line-clamp-1 group-hover:text-primary transition-colors">
                      {entry.game?.title}
                    </h3>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-dashed border-border rounded-2xl bg-surface/30">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface border border-border mb-4">
              <Gamepad2 className="h-8 w-8 text-text-muted" />
            </div>
            <h3 className="font-display text-xl font-bold text-white mb-2">No games in this list yet</h3>
            <p className="text-text-muted max-w-sm mb-8">
              {profile.username}'s {TABS.find(t => t.id === activeTab)?.label.toLowerCase()} list is currently empty.
            </p>
            <Link
              to="/"
              className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-bold text-white shadow-[0_0_15px_rgba(255,87,34,0.3)] transition-all hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-[0_0_25px_rgba(255,87,34,0.5)]"
            >
              <Compass className="h-5 w-5" />
              Go Explore
            </Link>
          </div>
        )}
      </div>

      {/* Follow Login Prompt Modal */}
      {showFollowPrompt && !isLoggedIn && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowFollowPrompt(false)}
        >
          <div
            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-[#1a1a1a] border-t-4 border-t-primary shadow-[0_10px_40px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowFollowPrompt(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="p-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                <User className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-display text-2xl font-bold text-white">Want to follow this user?</h3>
              <p className="mb-8 text-text-muted">
                Log in to follow users, see their latest reviews, and build your gaming network.
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

      {/* AI Profile Picture Generator Modal */}
      {showAIGenerator && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowAIGenerator(false)}
        >
          <div
            className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-[rgba(31,41,55,0.95)] border border-[#ff5500] shadow-[0_0_30px_rgba(255,85,0,0.3)] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAIGenerator(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="p-8">
              <h3 className="mb-6 font-display text-2xl font-bold text-white flex items-center gap-2">
                <Camera className="h-6 w-6 text-primary" />
                AI-Powered Profile Picture Generator
              </h3>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="E.g. 'Cyberpunk Ninja', 'Retro Pixel Art', 'Futuristic Gamer Avatar'..."
                  className="flex-1 bg-background border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                />
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !aiPrompt.trim()}
                  className="flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-bold text-white shadow-[0_0_15px_rgba(255,87,34,0.4)] transition-all hover:bg-primary-hover hover:shadow-[0_0_25px_rgba(255,87,34,0.6)] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {isGenerating ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    'Generate'
                  )}
                </button>
              </div>

              {generateError && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {generateError}
                </div>
              )}

              {isGenerating && (
                <div className="flex flex-col items-center justify-center py-12 mb-8">
                  <div className="h-10 w-10 animate-spin rounded-full border-3 border-primary border-t-transparent mb-4"></div>
                  <p className="text-text-muted text-sm">Generating your AI avatars... This may take a few seconds.</p>
                </div>
              )}

              {!isGenerating && <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {generatedImages.map((img) => (
                  <div key={img.id} className="flex flex-col items-center gap-3">
                    <div
                      className={`relative w-32 h-32 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        selectedImage === img.url
                          ? 'border-[#ff5500] shadow-[0_0_20px_rgba(255,85,0,0.6)] scale-105'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedImage(img.url)}
                    >
                      <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                      {selectedImage === img.url && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <CheckCircle2 className="h-8 w-8 text-white drop-shadow-md" />
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-medium text-[#ff5500] drop-shadow-[0_0_5px_rgba(255,85,0,0.5)] text-center">
                      {img.label}
                    </span>
                    <button
                      onClick={() => setSelectedImage(img.url)}
                      className={`text-xs font-bold px-4 py-1.5 rounded-full transition-colors ${
                        selectedImage === img.url
                          ? 'bg-primary text-white'
                          : 'bg-surface border border-border text-text-muted hover:text-white hover:border-primary/50'
                      }`}
                    >
                      {selectedImage === img.url ? 'Selected' : 'Select'}
                    </button>
                  </div>
                ))}
              </div>}

              <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4 border-t border-border/50">
                <button
                  onClick={() => setShowAIGenerator(false)}
                  className="rounded-lg border border-[#4b5563] bg-transparent px-6 py-3 font-bold text-[#9ca3af] transition-all hover:border-white hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAvatar}
                  disabled={!selectedImage}
                  className="rounded-lg bg-primary px-6 py-3 font-bold text-white shadow-[0_0_15px_rgba(255,87,34,0.4)] transition-all hover:bg-primary-hover hover:shadow-[0_0_25px_rgba(255,87,34,0.6)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save New Profile Picture
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
