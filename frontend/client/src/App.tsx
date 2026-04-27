import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import ArXivAnalyzer from "./pages/ArXivAnalyzer";
import TextAnalysis from "./pages/TextAnalysis";
import ImageAnalysis from "./pages/ImageAnalysis";
import PDFAnalysis from "./pages/PDFAnalysis";
import { DashboardLayout } from "./components/DashboardLayout";


function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      
      {/* Dashboard Routes wrapper */}
      <Route path="/dashboard">
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
      </Route>

      <Route path="/dashboard/:module*">
        {(params) => (
          <DashboardLayout>
            <Switch>
              <Route path="/dashboard/arxiv" component={ArXivAnalyzer} />
              <Route path="/dashboard/performance" component={Dashboard} />
              <Route path="/dashboard/text" component={TextAnalysis} />
              <Route path="/dashboard/image" component={ImageAnalysis} />
              <Route path="/dashboard/pdf" component={PDFAnalysis} />
              
              {/* Fallback for other dashboard modules */}
              <Route path="/dashboard/:any*">
                <div className="p-8 flex items-center justify-center h-full">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2 text-foreground">Coming Soon</h2>
                    <p className="text-muted-foreground">The {params['module*']} module is currently under development.</p>
                  </div>
                </div>
              </Route>
            </Switch>
          </DashboardLayout>
        )}
      </Route>

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
