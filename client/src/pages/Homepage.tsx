import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, ArrowRight } from "lucide-react";
import { Link } from "wouter";
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
      <section className="text-center mb-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            <span className="text-primary">Voices</span> <span className="text-foreground">for Frank O'Hara</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            This project celebrates the poetry of Frank O'Hara through the diverse voices of readers from around the world. Upload your own reading of his poems and discover how different interpretations bring new life to his words.
          </p>
          
          {/* Frank O'Hara bio card */}
          <Card className="text-left mb-8 shadow-sm">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-start space-x-4">
                {/* Portrait placeholder - using a contemplative figure */}
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=150&h=150" 
                  alt="Frank O'Hara portrait" 
                  className="w-24 h-24 md:w-32 md:h-32 rounded-lg object-cover shadow-md flex-shrink-0" 
                />
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-foreground mb-3">About Frank O'Hara (1926-1966)</h2>
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
              <Card key={poem.id} className="hover:shadow-md transition-shadow group">
                <CardContent className="p-6">
                  <div className="cursor-pointer" onClick={() => window.location.href = `/poems/${poem.slug}`}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                        {poem.title}
                      </h3>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-muted-foreground mb-4">Written in {poem.year}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      "{poem.context}"
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-primary font-medium">
                      {statsLoading ? (
                        <Skeleton className="h-4 w-20" />
                      ) : (
                        `${stats?.[poem.slug] || 0} recordings`
                      )}
                    </span>
                    <a 
                      href={poem.externalLink}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                    >
                      Read full text <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
