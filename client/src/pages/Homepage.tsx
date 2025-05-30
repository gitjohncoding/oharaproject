import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import { Link } from "wouter";
import type { Poem } from "@shared/schema";
import Footer from "@/components/Footer";

export default function Homepage() {
  const { data: poems, isLoading: poemsLoading } = useQuery<Poem[]>({
    queryKey: ["/api/poems"],
  });

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

        {poemsLoading ? (
          <div className="text-center">Loading poems...</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {poems?.map((poem) => (
              <Card key={poem.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <Link to={`/poems/${poem.slug}`}>
                    <h3 className="text-xl font-semibold text-foreground hover:text-primary transition-colors mb-2">
                      {poem.title}
                    </h3>
                  </Link>
                  <p className="text-sm text-muted-foreground mb-3">({poem.year})</p>
                  <a
                    href={poem.externalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                  >
                    Read full text <ExternalLink className="w-3 h-3" />
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}