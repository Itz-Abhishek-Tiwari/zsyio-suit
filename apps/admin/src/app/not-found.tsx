import Link from "next/link";
import { Button } from "@zsyio/ui";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 text-center bg-background text-foreground animate-fade-in">
      <div className="w-12 h-12 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h1 className="text-3xl font-display font-semibold tracking-tight mb-2">404 - Page Not Found</h1>
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        The administration console page or resource you are looking for does not exist.
      </p>
      <Button asChild>
        <Link href="/">Return to Admin Console</Link>
      </Button>
    </div>
  );
}
