import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft, Home } from "lucide-react";

/**
 * Design: Modern Scientific Elegance
 * 404 page with gradient text and smooth transitions
 */
export default function NotFound() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center px-4">
      <div className="max-w-md text-center space-y-8">
        {/* 404 Illustration */}
        <div className="space-y-4">
          <div className="text-8xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            404
          </div>
          <h1 className="text-4xl font-bold text-foreground">
            Page Not Found
          </h1>
          <p className="text-lg text-muted-foreground">
            The page you're looking for doesn't exist or has been moved. Let's get you back on track.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <Button
            onClick={() => navigate("/")}
            className="bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/50 text-white font-semibold px-6 py-3 rounded-lg transition-smooth"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            className="border-border hover:bg-card px-6 py-3 rounded-lg transition-smooth"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
