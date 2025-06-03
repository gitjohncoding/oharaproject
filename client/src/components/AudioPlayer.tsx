import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, Heart, Play, Pause, RotateCcw, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Recording } from "@shared/schema";

interface AudioPlayerProps {
  recording: Recording;
}

export function AudioPlayer({ recording }: AudioPlayerProps) {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Check if recording is favorited
  const { data: recordingFavorites } = useQuery({
    queryKey: ["/api/favorites/recordings"],
    enabled: isAuthenticated,
  });

  const isFavorited = Array.isArray(recordingFavorites) ? recordingFavorites.some((fav: any) => fav.recordingId === recording.id) : false;

  // Add to favorites mutation
  const addFavoriteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/favorites/recordings/${recording.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites/recordings"] });
      toast({
        title: "Added to favorites",
        description: "Recording saved to your favorites.",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add to favorites.",
        variant: "destructive",
      });
    },
  });

  // Remove from favorites mutation
  const removeFavoriteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/favorites/recordings/${recording.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites/recordings"] });
      toast({
        title: "Removed from favorites",
        description: "Recording removed from your favorites.",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to remove from favorites.",
        variant: "destructive",
      });
    },
  });

  const handleFavoriteToggle = () => {
    if (isFavorited) {
      removeFavoriteMutation.mutate();
    } else {
      addFavoriteMutation.mutate();
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Listen to this reading`,
          text: `Check out this reading by ${recording.readerName}`,
          url: window.location.href,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied",
          description: "The link has been copied to your clipboard.",
        });
      }
    } catch (error) {
      console.error("Error sharing:", error);
      toast({
        title: "Error",
        description: "Failed to share the recording.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Audio control functions
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  const handleReplay = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="audio-player shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-foreground">{recording.readerName}</h3>
            <p className="text-sm text-muted-foreground">
              Uploaded {recording.approvedAt ? formatDate(recording.approvedAt) : 'Recently'}
            </p>
            {recording.location && (
              <p className="text-sm text-muted-foreground">📍 {recording.location}</p>
            )}
            {recording.background && (
              <p className="text-sm text-muted-foreground">👤 {recording.background}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleFavoriteToggle}
                disabled={addFavoriteMutation.isPending || removeFavoriteMutation.isPending}
                className={`text-muted-foreground hover:text-primary ${
                  isFavorited ? 'text-red-500 hover:text-red-600' : ''
                }`}
              >
                <Heart 
                  className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} 
                />
                <span className="sr-only">
                  {isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                </span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              className="text-muted-foreground hover:text-primary"
            >
              <Share2 className="w-4 h-4" />
              <span className="sr-only">Share recording</span>
            </Button>
          </div>
        </div>
        
        {/* Enhanced Audio Player */}
        <div className="space-y-4">
          {/* Hidden HTML5 Audio Element */}
          <audio 
            ref={audioRef}
            preload="metadata"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={handlePlay}
            onPause={handlePause}
            className="hidden"
          >
            <source 
              src={`/api/recordings/${recording.fileName}`} 
              type={recording.mimeType === 'audio/x-m4a' ? 'audio/mp4' : recording.mimeType} 
            />
            Your browser does not support the audio element.
          </audio>

          {/* Custom Audio Controls */}
          <div className="bg-gradient-to-r from-primary/5 to-blue-50 dark:to-blue-950/20 rounded-lg p-4">
            {/* Progress Bar */}
            <div className="audio-progress-bar w-full bg-muted rounded-full h-2 mb-4 cursor-pointer"
                 onClick={(e) => {
                   const rect = e.currentTarget.getBoundingClientRect();
                   const percent = (e.clientX - rect.left) / rect.width;
                   if (audioRef.current) {
                     audioRef.current.currentTime = percent * duration;
                   }
                 }}>
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-200" 
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>

            {/* Control Buttons and Time Display */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* Play/Pause Button */}
                <Button
                  variant="default"
                  size="lg"
                  onClick={togglePlayPause}
                  className="audio-control-btn w-12 h-12 rounded-full flex-shrink-0 touch-manipulation"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5 ml-0.5" />
                  )}
                  <span className="sr-only">
                    {isPlaying ? 'Pause' : 'Play'}
                  </span>
                </Button>

                {/* Replay Button */}
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleReplay}
                  className="audio-control-btn w-12 h-12 rounded-full flex-shrink-0 touch-manipulation hover:bg-primary/10"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="sr-only">Replay from beginning</span>
                </Button>

                {/* Volume Indicator */}
                <div className="hidden sm:flex items-center space-x-2 text-muted-foreground">
                  <Volume2 className="w-4 h-4" />
                  <span className="text-sm">Audio</span>
                </div>
              </div>

              {/* Time Display */}
              <div className="text-sm text-muted-foreground font-mono">
                <span>{formatTime(currentTime)}</span>
                <span className="mx-1">/</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Mobile-Friendly Additional Controls */}
            <div className="sm:hidden mt-3 flex justify-center">
              <div className="text-xs text-muted-foreground text-center">
                Tap progress bar to skip • Large touch targets for easy control
              </div>
            </div>
          </div>
        </div>
        
        {recording.interpretationNote && (
          <div className="interpretation-note">
            <p>{recording.interpretationNote}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
