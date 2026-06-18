import { Link, useLocation } from "wouter";
import { FileText, ClipboardList, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useAuth } from "@/lib/store";
import { Button } from "@/components/ui/button";


export function Navbar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 no-print">
      <div className="container mx-auto max-w-4xl flex h-14 max-w-screen-2xl items-center px-4 md:px-8">
        <div className="mr-4 flex flex-1">
          <Link href="/formulir" className="mr-6 flex items-center space-x-2">
            <span className="font-bold tracking-tight text-primary">Laporan IKT</span>
          </Link>
          <nav className="flex items-center space-x-4 md:space-x-6 text-sm font-medium">
            <Link
              href="/formulir"
              className={cn(
                "transition-all duration-200 flex items-center gap-1.5 px-3 py-1.5 rounded-md border font-semibold",
                location === "/formulir" 
                  ? "bg-primary/10 text-primary border-primary shadow-sm" 
                  : "text-muted-foreground border-border/50 hover:border-border hover:bg-accent/50 hover:text-foreground"
              )}
            >
              <FileText className="h-4 w-4" />
              Upload Kegiatan
            </Link>
            <Link
              href="/arsip"
              className={cn(
                "transition-all duration-200 flex items-center gap-1.5 px-3 py-1.5 rounded-md border font-semibold",
                location.startsWith("/arsip") || location.startsWith("/preview")
                  ? "bg-primary/10 text-primary border-primary shadow-sm"
                  : "text-muted-foreground border-border/50 hover:border-border hover:bg-accent/50 hover:text-foreground"
              )}
            >
              <ClipboardList className="h-4 w-4" />
              Lihat Laporan
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-3">
              <div className="text-sm hidden sm:block">
                <span className="text-muted-foreground">Halo, </span>
                <span className="font-semibold text-foreground">{user.username}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => logout()} title="Logout">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
