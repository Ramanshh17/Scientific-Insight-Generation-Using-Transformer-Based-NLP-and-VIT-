import { Button } from "@/components/ui/button";
import Hero from "@/components/ui/animated-shader-hero";
import { ArrowRight, Brain, Zap, BarChart3, Microscope, Lightbulb, Rocket } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

/**
 * Design Philosophy: Modern Scientific Elegance
 * - Glassmorphism effects for premium feel
 * - Indigo-Cyan color palette reflecting scientific innovation
 * - Asymmetric layouts with generous whitespace
 * - Smooth micro-interactions and transitions
 */

export default function Home() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [, setLocation] = useLocation();

  const handleGetStarted = () => {
    setLocation('/dashboard');
  };

  const handleExplore = () => {
    setLocation('/dashboard');
  };

  return (
    <div className="w-full min-h-screen bg-background text-foreground">
      {/* Hero Section with WebGL Shader Background */}
      <Hero
        trustBadge={{
          text: "Trusted by leading research institutions worldwide",
          icons: ["🔬", "🤖", "⚡"]
        }}
        headline={{
          line1: "Autonomous",
          line2: "Scientific Discovery"
        }}
        subtitle="InsightNexus is an AI-driven multimodal framework that autonomously generates and tests scientific hypotheses end-to-end. Transform how scientists work by automating 80% of research overhead."
        buttons={{
          primary: {
            text: "Start Free Trial",
            onClick: handleGetStarted
          },
          secondary: {
            text: "View Documentation",
            onClick: handleExplore
          }
        }}
      />

      {/* Problem Statement Section */}
      <section className="relative py-20 md:py-32 px-4 md:px-8 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Problem */}
            <div className="space-y-6">
              <div className="inline-block px-4 py-2 rounded-full bg-accent/10 border border-accent/30">
                <span className="text-sm font-semibold text-accent">The Challenge</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                Scientists Spend 80% of Time on Routine Tasks
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Reading papers, analyzing data, running experiments, managing workflows. The bottleneck isn't creativity—it's execution. No AI platform can autonomously generate and test scientific hypotheses end-to-end.
              </p>
              <ul className="space-y-4 pt-4">
                {[
                  "Manual literature review and synthesis",
                  "Repetitive data processing and cleaning",
                  "Sequential experimental design",
                  "Fragmented tool ecosystems"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-1 w-2 h-2 rounded-full bg-accent flex-shrink-0" />
                    <span className="text-foreground/80">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: Visual */}
            <div className="relative h-96 rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/20 rounded-2xl" />
              <div className="absolute inset-0 backdrop-blur-sm" />
              <div className="relative h-full flex items-center justify-center">
                <div className="space-y-4 w-full px-8">
                  {[
                    { label: "Literature Review", value: "32%" },
                    { label: "Data Processing", value: "28%" },
                    { label: "Experiment Setup", value: "24%" },
                    { label: "Analysis & Reporting", value: "16%" }
                  ].map((item, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-foreground/70">{item.label}</span>
                        <span className="font-semibold text-accent">{item.value}</span>
                      </div>
                      <div className="h-2 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                          style={{ width: item.value }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section - How InsightNexus Works */}
      <section className="relative py-20 md:py-32 px-4 md:px-8 bg-card/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 rounded-full bg-secondary/10 border border-secondary/30 mb-4">
              <span className="text-sm font-semibold text-secondary">How It Works</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              The InsightNexus Framework
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A multimodal AI system that understands text, data, and experimental results to autonomously drive scientific discovery
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: "Hypothesis Generation",
                description: "AI analyzes literature, datasets, and prior findings to generate novel, testable hypotheses with scientific rigor"
              },
              {
                icon: Zap,
                title: "Autonomous Experimentation",
                description: "Design and execute experiments programmatically, adapt parameters in real-time based on results"
              },
              {
                icon: BarChart3,
                title: "Insight Synthesis",
                description: "Aggregate results across experiments, identify patterns, and generate actionable scientific insights"
              }
            ].map((item, i) => (
              <div
                key={i}
                className="group relative p-8 rounded-2xl border border-border/50 bg-background hover:border-accent/50 transition-smooth cursor-pointer"
                onMouseEnter={() => setHoveredCard(i)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {/* Hover glow effect */}
                {hoveredCard === i && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent/10 to-secondary/5 pointer-events-none" />
                )}
                
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent p-2.5 mb-6">
                    <item.icon className="w-full h-full text-white" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Capabilities Section */}
      <section className="relative py-20 md:py-32 px-4 md:px-8 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Features */}
            <div className="space-y-8">
              <div>
                <div className="inline-block px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-4">
                  <span className="text-sm font-semibold text-primary">Capabilities</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                  Built for Modern Science
                </h2>
              </div>

              {[
                {
                  icon: Microscope,
                  title: "Multi-Modal Understanding",
                  desc: "Process scientific papers, datasets, images, and experimental data simultaneously"
                },
                {
                  icon: Lightbulb,
                  title: "Hypothesis Testing",
                  desc: "Automatically design experiments and validate hypotheses with statistical rigor"
                },
                {
                  icon: Rocket,
                  title: "Accelerated Discovery",
                  desc: "Reduce research cycles from months to weeks with autonomous execution"
                }
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-secondary to-accent p-2.5 flex-shrink-0">
                    <item.icon className="w-full h-full text-white" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                    <p className="text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right: Glass Card */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/20 rounded-3xl blur-2xl opacity-50" />
              <div className="relative p-8 rounded-2xl border border-accent/30 bg-white/5 backdrop-blur-xl">
                <div className="space-y-6">
                  <div className="h-32 rounded-lg bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-accent mb-2">80%</div>
                      <p className="text-sm text-foreground/60">Time Saved on Research</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <p className="text-foreground/80 leading-relaxed">
                      InsightNexus automates the routine tasks that consume most of a scientist's time, freeing them to focus on creative hypothesis formation and strategic research direction.
                    </p>
                    <div className="pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground mb-3">Typical workflow improvements:</p>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                          <span>Literature synthesis in hours, not weeks</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                          <span>Parallel experiment execution</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                          <span>Real-time result analysis</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="relative py-20 md:py-32 px-4 md:px-8 bg-card/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 rounded-full bg-accent/10 border border-accent/30 mb-4">
              <span className="text-sm font-semibold text-accent">Applications</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Transforming Research Across Disciplines
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                domain: "Drug Discovery",
                description: "Accelerate compound screening and lead optimization with autonomous hypothesis generation"
              },
              {
                domain: "Materials Science",
                description: "Discover novel materials through systematic exploration of composition-property relationships"
              },
              {
                domain: "Climate Research",
                description: "Analyze complex climate datasets to identify patterns and validate predictive models"
              },
              {
                domain: "Genomics",
                description: "Process sequencing data and literature to identify disease-gene associations autonomously"
              }
            ].map((item, i) => (
              <div
                key={i}
                className="p-8 rounded-2xl border border-border/50 bg-background hover:border-primary/50 transition-smooth group cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-foreground">{item.domain}</h3>
                  <ArrowRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 md:py-32 px-4 md:px-8 bg-background">
        <div className="container mx-auto max-w-4xl">
          <div className="relative p-12 md:p-16 rounded-3xl border border-accent/30 bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-accent/20 to-transparent rounded-full blur-3xl -z-10" />
            
            <div className="relative z-10 text-center space-y-8">
              <h2 className="text-4xl md:text-5xl font-bold">
                Ready to Transform Your Research?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Join leading research institutions using InsightNexus to accelerate scientific discovery. Start your free trial today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/50 text-white font-semibold px-8 py-6 rounded-lg transition-smooth"
                  onClick={handleGetStarted}
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-border hover:bg-card px-8 py-6 rounded-lg transition-smooth"
                  onClick={handleExplore}
                >
                  Schedule Demo
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-background/50 backdrop-blur-sm">
        <div className="container mx-auto max-w-6xl px-4 md:px-8 py-12 md:py-16">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="font-bold text-lg mb-4">InsightNexus</h3>
              <p className="text-sm text-muted-foreground">
                AI-driven multimodal framework for autonomous scientific discovery.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/50 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
            <p>&copy; 2026 InsightNexus. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-foreground transition-colors">Twitter</a>
              <a href="#" className="hover:text-foreground transition-colors">LinkedIn</a>
              <a href="#" className="hover:text-foreground transition-colors">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
