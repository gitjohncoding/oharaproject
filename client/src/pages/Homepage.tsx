import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { PoemCard } from "@/components/PoemCard";
import type { Poem } from "@shared/schema";
import Footer from "@/components/Footer";

interface PoemStats {
  [slug: string]: number;
}

export default function Homepage() {
  const { data: poems, isLoading: poemsLoading, error: poemsError } = useQuery<Poem[]>({
    queryKey: ["/api/poems"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<PoemStats>({
    queryKey: ["/api/poems/stats"],
  });

  if (poemsLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              <span className="text-primary">Voices</span> for Frank O'Hara
            </h1>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              This project celebrates the poetry of Frank O'Hara through the diverse voices of readers from around the world. Upload your own reading of his poems and discover how different interpretations bring new life to his words.
            </p>
          </div>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-8">Current Poems</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-3" />
                  <Skeleton className="h-4 w-1/4 mb-4" />
                  <Skeleton className="h-20 w-full mb-4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (poemsError) {
    return (
      <div className="min-h-screen bg-background">
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              <span className="text-primary">Voices</span> for Frank O'Hara
            </h1>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              This project celebrates the poetry of Frank O'Hara through the diverse voices of readers from around the world. Upload your own reading of his poems and discover how different interpretations bring new life to his words.
            </p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Unable to load poems at this time. Please try again later.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            <span className="text-primary">Voices</span> for Frank O'Hara
          </h1>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            This project celebrates the poetry of Frank O'Hara through the diverse voices of readers from around the world. Upload your own reading of his poems and discover how different interpretations bring new life to his words.
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
                  <h2 className="text-xl font-semibold text-foreground mb-3">About Frank O'Hara (1926-1966)</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Frank O'Hara was a key figure in the New York School of poetry, known for his conversational style and intimate observations of daily life. His poems capture moments of connection, art, and urban experience with remarkable immediacy and warmth.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Poems Section */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-foreground">Current Poems</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {poems?.map((poem) => (
              <PoemCard 
                key={poem.id} 
                poem={poem} 
                recordingCount={stats?.[poem.slug] || 0} 
              />
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}