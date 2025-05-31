import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { AudioPlayer } from "@/components/AudioPlayer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Heart } from "lucide-react";
import type { Recording, FavoriteRecording, FavoritePoem, FavoritePoet, Poem } from "@shared/schema";

export default function ProfilePage() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
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
  }, [isAuthenticated, authLoading, toast]);

  const { data: recordingFavorites, isLoading: recordingFavoritesLoading } = useQuery<FavoriteRecording[]>({
    queryKey: ["/api/favorites/recordings"],
    enabled: isAuthenticated,
  });

  const { data: poemFavorites, isLoading: poemFavoritesLoading } = useQuery<FavoritePoem[]>({
    queryKey: ["/api/favorites/poems"],
    enabled: isAuthenticated,
  });

  const { data: poetFavorite, isLoading: poetFavoriteLoading } = useQuery<FavoritePoet | null>({
    queryKey: ["/api/favorites/poet"],
    enabled: isAuthenticated,
  });

  const { data: recordings } = useQuery<Recording[]>({
    queryKey: ["/api/recordings"],
    enabled: isAuthenticated,
  });

  const { data: poems } = useQuery<Poem[]>({
    queryKey: ["/api/poems"],
    enabled: isAuthenticated,
  });

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Match favorites with actual data
  const favoriteRecordings = recordingFavorites?.map(fav => {
    return recordings?.find(r => r.id === fav.recordingId);
  }).filter(Boolean) as Recording[] || [];

  const favoritePoems = poemFavorites?.map(fav => {
    return poems?.find(p => p.id === fav.poemId);
  }).filter(Boolean) as Poem[] || [];

  const favoritesLoading = recordingFavoritesLoading || poemFavoritesLoading || poetFavoriteLoading;

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

        <div className="space-y-8">
          {/* Poet Favorite */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Heart className="h-5 w-5 text-red-500" />
                <span>My Favorite Poets</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {poetFavoriteLoading ? (
                <div className="h-20 bg-muted rounded-lg animate-pulse" />
              ) : (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">📖</div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Frank O'Hara (1926-1966)
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    American poet who became a member of the New York School of poetry.
                  </p>
                  {poetFavorite ? (
                    <p className="text-primary font-medium">
                      ❤️ You've favorited this poet
                    </p>
                  ) : (
                    <p className="text-muted-foreground">
                      Explore poems and recordings to show your appreciation for Frank O'Hara
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Favorite Poems */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Heart className="h-5 w-5 text-red-500" />
                <span>My Favorite Poems</span>
                <span className="text-sm text-muted-foreground font-normal">
                  ({favoritePoems.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {poemFavoritesLoading ? (
                <div className="space-y-4">
                  {[1, 2].map(i => (
                    <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : favoritePoems.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No favorite poems yet
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Explore poems and save your favorites to see them here.
                  </p>
                  <a
                    href="/"
                    className="text-primary hover:underline font-medium"
                  >
                    Browse poems
                  </a>
                </div>
              ) : (
                <div className="space-y-4">
                  {favoritePoems.map((poem) => (
                    <Card key={poem.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-foreground">{poem.title}</h4>
                          <p className="text-sm text-muted-foreground">Published {poem.year}</p>
                        </div>
                        <a
                          href={`/poems/${poem.slug}`}
                          className="text-primary hover:underline font-medium"
                        >
                          View Poem
                        </a>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Favorite Recordings */}
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
              {recordingFavoritesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : favoriteRecordings.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No favorite recordings yet
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
    </div>
  );
}