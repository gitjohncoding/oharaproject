import Footer from "@/components/Footer";

export default function Homepage() {
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
      </main>
      <Footer />
    </div>
  );
}