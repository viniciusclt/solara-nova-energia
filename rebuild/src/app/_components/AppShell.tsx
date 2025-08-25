"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Bell, Settings, Menu, ChevronLeft, ChevronRight, Sun, Moon, Zap, GraduationCap, FileText, GitBranch, BookOpen, Flame, Waves, Wrench } from "lucide-react";

// AppShell inspirado no layout antigo (Sidebar + Header), usando variáveis de tema definidas em globals.css
// Mantém visual consistente sem depender de libs externas.

type NavItem = {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Início", href: "/", icon: Home },
  { label: "Leads", href: "/leads", icon: Users },
  { label: "Fotovoltaico", href: "/solar", icon: Sun },
  { label: "Propostas", href: "/proposals", icon: FileText },
  { label: "Treinamentos", href: "/training", icon: GraduationCap },
  { label: "Diagramas", href: "/diagrams", icon: GitBranch },
  { label: "Playbooks", href: "/playbooks", icon: BookOpen },
  { label: "AQB", href: "/aqb", icon: Flame },
  { label: "AQP", href: "/aqp", icon: Waves },
  { label: "Wallbox", href: "/wallbox", icon: Zap },
  { label: "Admin", href: "/admin", icon: Wrench },
];

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

// Utils simples de cookie para persistir preferências do usuário
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()\[\\]\/+^])/g, "\\$1") + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, days = 365) {
  if (typeof document === "undefined") return;
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${d.toUTCString()}`;
}

function Sidebar({
  open,
  onClose,
  collapsed,
  onToggleCollapsed,
}: {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  const pathname = usePathname();
  const activeMap = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const i of NAV_ITEMS) {
      if (i.href === "/") {
        map.set(i.href, pathname === "/");
      } else {
        map.set(i.href, Boolean(pathname?.startsWith(i.href)));
      }
    }
    return map;
  }, [pathname]);

  return (
    <>
      {/* Overlay para mobile */}
      <div
        onClick={onClose}
        className={classNames(
          "lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        aria-hidden={!open}
      />

      <aside
        className={classNames(
          "fixed lg:static z-50 top-0 left-0 h-dvh w-64 shrink-0 border-r",
          "bg-sidebar-bg text-sidebar-fg border-sidebar-border",
          "transition-[transform,width] duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          collapsed ? "lg:w-16" : "lg:w-64"
        )}
        aria-label="Barra lateral de navegação"
        aria-expanded={open}
      >
        <div className="flex h-14 items-center gap-2 px-4 border-b border-sidebar-border">
          <div className="size-7 rounded-md bg-[radial-gradient(circle_at_30%_30%,hsl(var(--accent)),hsl(var(--primary)))] shadow-[var(--shadow-solar)]" />
          <span className={classNames("text-sm font-semibold", collapsed ? "lg:hidden" : "")}>Solara Nova Energia</span>
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="ml-auto hidden lg:inline-flex items-center justify-center rounded-md border border-sidebar-border bg-sidebar-accent p-1.5 hover:bg-sidebar-accent/70"
            aria-label={collapsed ? "Expandir barra lateral" : "Colapsar barra lateral"}
            aria-pressed={collapsed}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <nav className="p-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = activeMap.get(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={classNames(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                  "transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-fg font-medium"
                    : "hover:bg-sidebar-accent/60",
                  collapsed ? "lg:justify-center" : ""
                )}
                aria-current={active ? "page" : undefined}
              >
                {Icon ? (
                  <Icon className={classNames("h-4 w-4", active ? "text-[hsl(var(--primary))]" : "text-sidebar-fg/70")} />
                ) : (
                  <span
                    className="inline-block size-1.5 rounded-full"
                    style={{ background: active ? "hsl(var(--primary))" : "hsl(var(--sidebar-ring))" }}
                  />
                )}
                <span className={collapsed ? "lg:hidden" : ""}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto p-3 text-xs text-sidebar-fg/70 hidden lg:block">
          <div className="rounded-md border border-sidebar-border p-3 bg-sidebar-accent/40">
            <p className="font-medium">Dica</p>
            <p>Use Ctrl/Cmd+B para abrir/fechar. Ctrl/Cmd+Shift+B para colapsar/expandir.</p>
          </div>
        </div>
      </aside>
    </>
  );
}

function useBreadcrumb() {
  const pathname = usePathname();
  const map: Record<string, string> = {
    "/": "Início",
    "/leads": "Leads",
    "/leads/new": "Novo Lead",
    "/solar": "Fotovoltaico",
    "/proposals": "Propostas",
    "/training": "Treinamentos",
    "/diagrams": "Diagramas",
    "/playbooks": "Playbooks",
    "/aqb": "Aquecimento Banho",
    "/aqp": "Aquecimento Piscina",
    "/wallbox": "Wallbox",
    "/admin": "Admin",
  };
  // Tratar rota dinâmica de edição de lead
  const isLeadDetail = pathname?.startsWith("/leads/") && pathname !== "/leads" && pathname !== "/leads/new";
  const current = isLeadDetail ? "Editar Lead" : map[pathname ?? "/"] ?? "Página";
  const segments = pathname?.split("/").filter(Boolean) ?? [];
  return {
    segments,
    current,
  };
}

function Header({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { current } = useBreadcrumb();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  useEffect(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
      const initial = saved === 'dark' || saved === 'light'
        ? saved
        : (document.documentElement.getAttribute('data-theme') || 'light');
      setTheme(initial as 'light' | 'dark');
      document.documentElement.setAttribute('data-theme', initial);
    } catch (_) {
      // noop
    }
  }, []);
  const toggleTheme = useCallback(() => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    try {
      localStorage.setItem('theme', next);
    } catch (_) {
      // noop
    }
    document.documentElement.setAttribute('data-theme', next);
  }, [theme]);
  return (
    <header className="sticky top-0 z-30 h-14 border-b border-sidebar-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center gap-3 px-4">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden inline-flex items-center justify-center rounded-md border border-sidebar-border bg-sidebar-accent px-2.5 py-1.5 text-sm text-sidebar-fg hover:bg-sidebar-accent/70"
          aria-label="Alternar menu lateral"
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-sidebar-fg/80">
          <Link href="/" className="hover:underline">Início</Link>
          <span className="text-sidebar-fg/50">/</span>
          <span className="font-medium text-sidebar-fg">{current}</span>
        </nav>

        <div className="flex-1" />

        {/* Ações do usuário */}
        <div className="flex items-center gap-2 text-sidebar-fg/80">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-sidebar-border bg-sidebar-accent hover:bg-sidebar-accent/70"
            aria-label="Notificações"
          >
            <Bell className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-sidebar-border bg-sidebar-accent hover:bg-sidebar-accent/70"
            aria-label="Configurações"
          >
            <Settings className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-sidebar-border bg-sidebar-accent hover:bg-sidebar-accent/70"
            aria-label="Alternar tema"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <div
            className="ml-1 size-8 rounded-full bg-sidebar-accent border border-sidebar-border"
            aria-label="Usuário"
            role="img"
          />
        </div>
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  // Inicializa estado da sidebar sem acessar window no SSR; aplica cookie após mount
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  useEffect(() => {
    const v = getCookie("sidebar_open");
    if (v === "1" || v === "0") {
      setSidebarOpen(v === "1");
    }
    const c = getCookie("sidebar_collapsed");
    if (c === "1" || c === "0") {
      setSidebarCollapsed(c === "1");
    }
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((v) => {
      const next = !v;
      setCookie("sidebar_open", next ? "1" : "0");
      return next;
    });
  }, []);

  const toggleSidebarCollapsed = useCallback(() => {
    setSidebarCollapsed((v) => {
      const next = !v;
      setCookie("sidebar_collapsed", next ? "1" : "0");
      return next;
    });
  }, []);

  // Atalho Ctrl/Cmd + B (Shift para colapsar/expandir)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      if ((isMac ? e.metaKey : e.ctrlKey) && (e.key === "b" || e.key === "B")) {
        e.preventDefault();
        if (e.shiftKey) {
          toggleSidebarCollapsed();
        } else {
          toggleSidebar();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleSidebar, toggleSidebarCollapsed]);

  return (
    <div className="min-h-dvh w-full bg-background text-foreground">
      <div className="flex">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          collapsed={sidebarCollapsed}
          onToggleCollapsed={toggleSidebarCollapsed}
        />

        <div className={classNames("flex min-h-dvh w-full flex-col", sidebarCollapsed ? "lg:pl-16" : "lg:pl-64")}>
          <Header onToggleSidebar={toggleSidebar} />

          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}

export default AppShell;