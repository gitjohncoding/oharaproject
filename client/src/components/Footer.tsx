import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-muted/30 border-t border-border mt-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
          <div className="mb-4 md:mb-0">
            <p>© 2024 Voices for Frank O'Hara. A community poetry archive.</p>
          </div>
          <div className="flex items-center space-x-6">
            <Link href="/poems">
              <span className="hover:text-foreground transition-colors cursor-pointer">
                Browse Poems
              </span>
            </Link>
            <Link href="/about">
              <span className="hover:text-foreground transition-colors cursor-pointer">
                About
              </span>
            </Link>
            <Link href="/admin">
              <span className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors cursor-pointer">
                •
              </span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}