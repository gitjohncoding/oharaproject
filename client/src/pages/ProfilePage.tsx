import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { AudioPlayer } from "@/components/AudioPlayer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Heart } from "lucide-react";
import type { Recording, Favorite } from "@shared/schema";

interface FavoriteWithRecording extends Favorite {
  recording?: Recording;
}

export default function ProfilePage() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  const { data: favorites, isLoading: favoritesLoading } = useQuery<FavoriteWithRecording[]>({
    queryKey: ["/api/favorites"],
    enabled: isAuthenticated,
  });

  const { data: recordings } = useQuery<Recording[]>({
    queryKey: ["/api/recordings"],
    enabled: isAuthenticated,
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Match favorites with recordings
  const favoriteRecordings = favorites?.map(favorite => {
    const recording = recordings?.find(r => r.id === favorite.recordingId);
    return recording;
  }).filter(Boolean) as Recording[] || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <User className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
              <p className="text-muted-foreground">
                Welcome back, {(user as any)?.firstName || (user as any)?.email || 'User'}
              </p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Heart className="h-5 w-5 text-red-500" />
              <span>My Favorite Recordings</span>
              <span className="text-sm text-muted-foreground font-normal">
                ({favoriteRecordings.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {favoritesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : favoriteRecordings.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No favorites yet
                </h3>
                <p className="text-muted-foreground mb-4">
                  Start exploring recordings and save your favorites to see them here.
                </p>
                <a
                  href="/"
                  className="text-primary hover:underline font-medium"
                >
                  Browse recordings
                </a>
              </div>
            ) : (
              <div className="space-y-6">
                {favoriteRecordings.map((recording) => (
                  <AudioPlayer key={recording.id} recording={recording} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}