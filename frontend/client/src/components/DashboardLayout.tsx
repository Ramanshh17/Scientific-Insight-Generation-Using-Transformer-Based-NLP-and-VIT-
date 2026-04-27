import { 
  BarChart3, 
  Brain, 
  ChevronRight, 
  Database, 
  FileText, 
  History, 
  Home, 
  Image as ImageIcon, 
  Layers, 
  LayoutDashboard, 
  Lightbulb, 
  Microscope, 
  Search, 
  Zap,
  Menu
} from "lucide-react";
import * as React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset
} from "@/components/ui/sidebar";

const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Text Analysis",
    url: "/dashboard/text",
    icon: FileText,
  },
  {
    title: "Image Analysis",
    url: "/dashboard/image",
    icon: ImageIcon,
  },
  {
    title: "PDF Analysis",
    url: "/dashboard/pdf",
    icon: Microscope,
  },
  {
    title: "Model Performance",
    url: "/dashboard/performance",
    icon: Zap,
  },
  {
    title: "Recent Files",
    url: "/dashboard/recent",
    icon: History,
  },
  {
    title: "arXiv Analyzer",
    url: "/dashboard/arxiv",
    icon: Search,
  },
  {
    title: "EDA Explorer",
    url: "/dashboard/eda",
    icon: BarChart3,
  },
  {
    title: "Hypotheses",
    url: "/dashboard/hypotheses",
    icon: Brain,
  },
  {
    title: "Insights Hub",
    url: "/dashboard/insights",
    icon: Lightbulb,
  },
  {
    title: "Cross Modal",
    url: "/dashboard/cross-modal",
    icon: Layers,
  },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background dark:bg-zinc-950">
        <Sidebar className="border-r border-border/50 bg-card/30 backdrop-blur-xl">
          <SidebarHeader className="p-6">
            <Link href="/" className="flex items-center gap-3 px-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-foreground">SciMultiAnalyzer</span>
                <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/70">Multi-Modal Framework</span>
              </div>
            </Link>
          </SidebarHeader>
          <SidebarContent className="px-4 py-2">
            <SidebarGroup>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200",
                        location === item.url 
                          ? "bg-primary/10 text-primary shadow-sm" 
                          : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
                      )}
                      tooltip={item.title}
                    >
                      <Link href={item.url}>
                        <item.icon className={cn(
                          "h-5 w-5 transition-transform duration-200 group-hover:scale-110",
                          location === item.url ? "text-primary" : "text-muted-foreground/70"
                        )} />
                        <span className="font-medium text-sm">{item.title}</span>
                        {location === item.url && (
                          <div className="absolute right-3 h-1.5 w-1.5 rounded-full bg-primary" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-6">
            <div className="rounded-2xl bg-accent/5 p-4 border border-border/40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Analysis Stats</span>
              </div>
              <div className="space-y-2">
                {[
                  { label: "Texts", count: 0, color: "bg-blue-500" },
                  { label: "Images", count: 0, color: "bg-purple-500" },
                  { label: "PDFs", count: 0, color: "bg-pink-500" },
                  { label: "ArXiv", count: 0, color: "bg-green-500" },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{stat.label}</span>
                    <span className="font-mono font-bold text-foreground">{stat.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex flex-col bg-background/50">
          <header className="flex h-16 items-center border-b border-border/40 px-8 backdrop-blur-md sticky top-0 z-30 justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="h-9 w-9 border border-border/40 bg-card/50" />
              <div className="h-4 w-px bg-border/40 mx-2" />
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Home className="h-4 w-4" />
                <ChevronRight className="h-4 w-4 opacity-40" />
                <span className="text-foreground capitalize">{location.split('/').pop() || 'Dashboard'}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search analysis..." 
                  className="h-9 w-64 rounded-xl border border-border/40 bg-card/50 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-medium"
                />
              </div>
              <div className="h-9 w-9 rounded-xl border border-border/40 bg-card/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                <Zap className="h-4 w-4" />
              </div>
            </div>
          </header>
          <div className="flex-1 overflow-auto bg-zinc-50/30 dark:bg-zinc-950/30">
            {children}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
