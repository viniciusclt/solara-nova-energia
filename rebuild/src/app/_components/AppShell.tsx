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

// Novo: grupos de navegação organizados por seções
type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    id: "inicio",
    label: "Início",
    items: [
      { label: "Início", href: "/", icon: Home },
    ],
  },
  {
    id: "comercial",
    label: "Comercial",
    items: [
      { label: "Contatos", href: "/contacts", icon: Users },
      { label: "Oportunidades", href: "/opportunities" },
      { label: "Propostas", href: "/proposals", icon: FileText },
      { label: "Arquivos", href: "/storage", icon: FileText },
    ],
  },
  {
    id: "projetos",
    label: "Projetos",
    items: [
      // Prioridade: Fotovoltaico primeiro dentro de Projetos
      { label: "Fotovoltaico", href: "/solar", icon: Sun },
      { label: "AQB", href: "/aqb", icon: Flame },
      { label: "AQP", href: "/aqp", icon: Waves },
      { label: "Wallbox", href: "/wallbox", icon: Zap },
    ],
  },
  {
    id: "treinamentos",
    label: "Treinamentos",
    items: [
      { label: "Treinamentos", href: "/training", icon: GraduationCap },
      { label: "Diagramas", href: "/diagrams", icon: GitBranch },
      { label: "Playbooks", href: "/playbooks", icon: BookOpen },
    ],
  },
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
    for (const group of NAV_GROUPS) {
      for (const i of group.items) {
        if (i.href === "/") {
          map.set(i.href, pathname === "/");
        } else {
          const normalActive = Boolean(pathname?.startsWith(i.href));
          const contactsAliasActive = i.href === "/contacts" && Boolean(pathname?.startsWith("/leads"));
          map.set(i.href, normalActive || contactsAliasActive);
        }
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
        id="app-sidebar"
        className={classNames(
          "fixed lg:static z-50 top-0 left-0 h-dvh w-64 shrink-0 border-r",
          "bg-sidebar-bg text-sidebar-fg border-sidebar-border",
          "transition-[transform,width] duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          collapsed ? "lg:w-16" : "lg:w-64"
        )}
        aria-label="Barra lateral de navegação"
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

        {/* Navegação em grupos */}
        <nav className="p-2 space-y-3">
          {NAV_GROUPS.map((group, gi) => (
            <div key={group.id}>
              {!collapsed && (
                <div className="px-3 py-1 text-[11px] uppercase tracking-wide text-sidebar-fg/60">{group.label}</div>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
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
              </div>
              {gi < NAV_GROUPS.length - 1 && (
                <div className="my-2 border-t border-sidebar-border" aria-hidden="true" />
              )}
            </div>
          ))}
        </nav>

        {/* Rodapé: Configurações fixo na parte inferior */}
        <div className="mt-auto p-2 border-t border-sidebar-border">
          <Link
            href="/admin"
            onClick={onClose}
            className={classNames(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
              "transition-colors hover:bg-sidebar-accent/60"
            )}
            aria-label="Configurações"
          >
            <Settings className="h-4 w-4 text-sidebar-fg/80" />
            <span className={collapsed ? "lg:hidden" : ""}>Configurações</span>
          </Link>

          <div className="mt-2 rounded-md border border-sidebar-border p-3 bg-sidebar-accent/40 hidden lg:block">
            <p className="font-medium text-xs">Dica</p>
            <p className="text-xs">Use Ctrl/Cmd+B para abrir/fechar. Ctrl/Cmd+Shift+B para colapsar/expandir.</p>
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
    "/leads": "Contatos",
    "/leads/new": "Novo Contato",
    "/contacts": "Contatos",
    "/contacts/new": "Novo Contato",
    "/opportunities": "Oportunidades",
    "/opportunities/new": "Nova Oportunidade",
    "/solar": "Fotovoltaico",
    "/proposals": "Propostas",
    "/training": "Treinamentos",
    "/diagrams": "Diagramas",
    "/playbooks": "Playbooks",
    "/aqb": "Aquecimento Banho",
    "/aqp": "Aquecimento Piscina",
    "/wallbox": "Wallbox",
    "/storage": "Arquivos",
    "/admin": "Configurações",
  };
  // Tratar rotas dinâmicas
  const isLeadDetail = pathname?.startsWith("/leads/") && pathname !== "/leads" && pathname !== "/leads/new";
  const isContactDetail = pathname?.startsWith("/contacts/") && pathname !== "/contacts" && pathname !== "/contacts/new";
  const isOpportunityDetail = pathname?.startsWith("/opportunities/") && pathname !== "/opportunities" && pathname !== "/opportunities/new";
  const current = isLeadDetail
    ? "Editar Contato"
    : isContactDetail
    ? "Editar Contato"
    : isOpportunityDetail
    ? "Editar Oportunidade"
    : map[pathname ?? "/"] ?? "Página";
  const segments = pathname?.split("/").filter(Boolean) ?? [];
  return {
    segments,
    current,
  };
}

function Header({ onToggleSidebar, isSidebarOpen }: { onToggleSidebar: () => void; isSidebarOpen: boolean }) {
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
    } catch {
      // noop
    }
  }, []);
  const toggleTheme = useCallback(() => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    try {
      localStorage.setItem('theme', next);
    } catch {
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
          aria-controls="app-sidebar"
          aria-expanded={isSidebarOpen}
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
            onClick={toggleTheme}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-sidebar-border bg-sidebar-accent hover:bg-sidebar-accent/70"
            aria-label="Alternar tema"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Persistir preferências: colapsado (desktop)
  useEffect(() => {
    const saved = getCookie("sidebar-collapsed");
    setCollapsed(saved === "1");
  }, []);
  useEffect(() => {
    setCookie("sidebar-collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  return (
    <div className="flex min-h-dvh w-full">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((v) => !v)}
      />
      <div className="flex-1 flex flex-col">
        <Header onToggleSidebar={() => setSidebarOpen((v) => !v)} isSidebarOpen={sidebarOpen} />
        <main className="flex-1 p-4">{children}</main>
      </div>
    </div>
  );
}