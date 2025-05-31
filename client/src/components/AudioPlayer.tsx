import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, Heart } from "lucide-react";
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
        
        {/* HTML5 Audio Player */}
        <audio 
          controls 
          className="w-full mb-4"
          preload="metadata"
        >
          <source src={`/uploads/${recording.fileName}`} type={recording.mimeType} />
          Your browser does not support the audio element.
        </audio>
        
        {recording.interpretationNote && (
          <div className="interpretation-note">
            <p>{recording.interpretationNote}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
