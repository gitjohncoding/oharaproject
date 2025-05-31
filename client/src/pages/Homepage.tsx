import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { EnhancedPoemCard } from "@/components/EnhancedPoemCard";
import { PoetFavoriteButton } from "@/components/PoetFavoriteButton";
import type { Poem } from "@shared/schema";

interface PoemStats {
  [slug: string]: number;
}

export default function Homepage() {
  const { data: poems, isLoading: poemsLoading } = useQuery<Poem[]>({
    queryKey: ["/api/poems"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<PoemStats>({
    queryKey: ["/api/poems/stats"],
  });

  if (poemsLoading) {
    return (
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <Skeleton className="h-12 w-96 mx-auto mb-6" />
          <Skeleton className="h-6 w-full max-w-4xl mx-auto mb-4" />
          <Skeleton className="h-6 w-3/4 mx-auto" />
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <section className="poetry-hero text-center mb-12">
        <div className="max-w-4xl mx-auto relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-white">
            <span className="text-white">WeRead</span> <span className="text-white/90">Frank O'Hara</span>
          </h1>
          <p className="text-lg text-white/80 mb-8 leading-relaxed">
            This project celebrates the poetry of Frank O'Hara through diverse readers from around the world. Upload your own reading of his poems and discover how different interpretations bring new life to his words.
          </p>
          
          {/* Frank O'Hara bio card */}
          <Card className="text-left mb-8 shadow-sm">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-start space-x-4">
                {/* Frank O'Hara portrait */}
                <img 
                  src="/attached_assets/image_1748641102249.png" 
                  alt="Frank O'Hara portrait" 
                  className="w-24 h-24 md:w-32 md:h-32 rounded-lg object-cover shadow-md flex-shrink-0" 
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xl font-semibold text-foreground">About Frank O'Hara (1926-1966)</h2>
                    <PoetFavoriteButton />
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Frank O'Hara was a key figure in the New York School of poetry, known for his conversational style and intimate observations of daily life. His poems capture moments of connection, art, and urban experience with remarkable immediacy and warmth.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Current Poems Section */}
      <section className="mb-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold text-foreground mb-8 text-center">Current Poems</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {poems?.map((poem) => (
              <EnhancedPoemCard 
                key={poem.id} 
                poem={poem} 
                recordingCount={statsLoading ? 0 : (stats?.[poem.slug] || 0)}
                showFavorite={true}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
