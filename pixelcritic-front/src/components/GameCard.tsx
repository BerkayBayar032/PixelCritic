import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Gamepad2, Monitor, Gamepad, Smartphone, Plus, Check } from 'lucide-react';

export const getPlatformIcon = (platformName: string) => {
  if (platformName.includes('PC')) return <Monitor className="h-3.5 w-3.5 text-text-muted group-hover/platform:text-primary transition-colors" />;
  if (platformName.includes('PlayStation')) return <Gamepad className="h-3.5 w-3.5 text-text-muted group-hover/platform:text-primary transition-colors" />;
  if (platformName.includes('Xbox')) return <Gamepad2 className="h-3.5 w-3.5 text-text-muted group-hover/platform:text-primary transition-colors" />;
  if (platformName.includes('Switch')) return <Smartphone className="h-3.5 w-3.5 text-text-muted group-hover/platform:text-primary transition-colors" />;
  return <Gamepad2 className="h-3.5 w-3.5 text-text-muted group-hover/platform:text-primary transition-colors" />;
};

interface GameCardProps {
  key?: React.Key;
  game: any;
  addedGames: Record<string, string>;
  activeMenu: string | null;
  handleAddGameClick: (e: React.MouseEvent, gameId: string) => void;
  handleSelectStatus: (e: React.MouseEvent, gameId: string, status: string) => void;
  selectedPlatforms?: string[];
}

export default function GameCard({
  game,
  addedGames,
  activeMenu,
  handleAddGameClick,
  handleSelectStatus,
  selectedPlatforms = []
}: GameCardProps) {
  return (
    <Link 
      to={`/games/${game._id}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-surface border border-border transition-all hover:border-primary/50 hover:shadow-[0_0_20px_rgba(255,87,34,0.3)] hover:-translate-y-1"
    >
      {/* Cover Image */}
      <div className="relative h-48 w-full overflow-hidden bg-background">
        {addedGames[game._id] && (
          <div className="absolute top-3 left-0 z-10 bg-black/85 backdrop-blur-sm border-l-[3px] border-primary shadow-[0_0_10px_rgba(255,87,34,0.5)] rounded-r-md px-3 py-1.5">
            <span className="text-[0.75rem] font-bold text-white tracking-[0.5px] uppercase">
              {addedGames[game._id]}
            </span>
          </div>
        )}
        <img 
          src={game.coverImage || "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&q=80&w=800"} 
          alt={game.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-80 group-hover:opacity-100"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-transparent" />
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5 relative">
        <div className="mb-3 flex flex-wrap gap-1.5">
          {game.genres?.slice(0, 2).map((genre: string) => (
            <span 
              key={genre} 
              className="rounded-full bg-[#1a1a1a] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white border border-primary shadow-[0_0_8px_rgba(255,87,34,0.4)] transition-all"
            >
              {genre}
            </span>
          ))}
          {game.themes?.slice(0, 2).map((theme: string) => (
            <span 
              key={theme} 
              className="rounded-full bg-[#1a1a1a] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white border border-primary shadow-[0_0_8px_rgba(255,87,34,0.4)] transition-all"
            >
              {theme}
            </span>
          ))}
        </div>
        
        <h3 className="font-display text-xl font-bold text-white mb-1 group-hover:text-primary transition-colors line-clamp-1">
          {game.title}
        </h3>
        <p className="text-sm text-text-muted mb-4 whitespace-nowrap overflow-hidden text-ellipsis">
          {game.developer} • {game.publisher || "Unknown"}
        </p>
        
        {/* Platform Scores Sub-section */}
        <div className="space-y-2">
          {(selectedPlatforms.length > 0 && game.platforms
            ? game.platforms.filter((p: any) => selectedPlatforms.includes(p.name))
            : (game.platforms || [])
          ).map((platform: any) => (
            <div key={platform.name} className="flex items-center justify-between gap-2 group/platform transition-all duration-300">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-background border border-border group-hover/platform:border-primary/30 transition-colors">
                  {getPlatformIcon(platform.name)}
                </div>
                <span className="text-xs font-medium text-text-muted group-hover/platform:text-white transition-colors truncate">
                  {platform.name}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-1.5 bg-background/50 px-2 py-1 rounded-full border border-border">
                <span className="font-mono text-xs font-bold text-white">{platform.score.toFixed(1)}</span>
                <Star className="h-3 w-3 fill-primary text-primary drop-shadow-[0_0_5px_rgba(255,87,34,0.8)]" />
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center mt-auto pt-8">
          <span className="text-white/70 text-xs font-medium">{game.releaseYear}</span>
          <div className="relative flex items-center justify-end gap-2">
            {addedGames[game._id] ? (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  // Mock remove logic
                  if (handleSelectStatus) {
                    handleSelectStatus(e, game._id, ''); // Pass empty string to signify removal
                  }
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-[10px] uppercase tracking-wider bg-transparent border border-[#4b5563] text-[#9ca3af] transition-all duration-300 hover:border-[#ff5500] hover:text-[#ff5500] hover:shadow-[0_0_15px_rgba(255,85,0,0.4)]"
              >
                - Remove
              </button>
            ) : (
              <button
                onClick={(e) => handleAddGameClick(e, game._id)}
                className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-full font-bold text-[10px] uppercase tracking-wider bg-[#1a1a1a] text-white border border-primary shadow-[0_0_8px_rgba(255,87,34,0.4)] hover:shadow-[0_0_15px_rgba(255,87,34,0.6)] transition-all duration-300"
              >
                <Plus className="h-3.5 w-3.5 text-white" />
                Add
              </button>
            )}
            
            {activeMenu === game._id && (
              <div className="absolute bottom-full right-0 mb-2 w-40 rounded-xl bg-[#1a1a1a] border border-border shadow-[0_0_20px_rgba(0,0,0,0.8)] overflow-hidden z-50">
                <div className="px-3 py-2 border-b border-border/50">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Add to library</span>
                </div>
                <div className="flex flex-col py-1">
                  {['Played', 'Playing', 'Plan to Play', 'Dropped'].map((status) => (
                    <button
                      key={status}
                      onClick={(e) => handleSelectStatus(e, game._id, status)}
                      className="px-3 py-2 text-sm text-left text-text-muted hover:text-white hover:bg-white/5 transition-colors group/item relative"
                    >
                      <span className="relative z-10">{status}</span>
                      <div className="absolute inset-0 opacity-0 group-hover/item:opacity-100 pointer-events-none transition-opacity">
                        <div className="absolute inset-y-0 left-0 w-0.5 bg-primary shadow-[0_0_8px_rgba(255,87,34,0.8)]" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
