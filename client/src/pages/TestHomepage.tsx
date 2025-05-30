import Footer from "@/components/Footer";

export default function TestHomepage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8">
          <span className="text-primary">Voices</span> for Frank O'Hara
        </h1>
        <p className="text-center text-lg text-muted-foreground mb-8">
          A community-driven poetry platform celebrating Frank O'Hara
        </p>
        <div className="text-center">
          <p>Homepage is loading correctly!</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}