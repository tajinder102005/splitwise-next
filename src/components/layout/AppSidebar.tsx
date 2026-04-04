import {
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  Target,
  BarChart3,
  Settings,
  LogOut,
  TrendingUp,
  Moon,
  Sun,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';

const mainNav = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboard },
  { title: 'Transactions', url: '/transactions', icon: ArrowLeftRight },
  { title: 'Budgets', url: '/budgets', icon: PiggyBank },
  { title: 'Goals', url: '/goals', icon: Target },
  { title: 'Analytics', url: '/analytics', icon: BarChart3 },
];

const bottomNav = [
  { title: 'Settings', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { signOut, user } = useAuth();

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <div className="flex h-16 items-center gap-3 px-4 border-b border-border/50">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <TrendingUp className="h-5 w-5" />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold text-foreground">finTrack</span>
        )}
      </div>

      <SidebarContent className="pt-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className="hover:bg-accent/50"
                      activeClassName="bg-accent text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/50 p-3 space-y-1">
        {bottomNav.map((item) => (
          <SidebarMenuButton key={item.title} asChild isActive={isActive(item.url)}>
            <NavLink
              to={item.url}
              className="hover:bg-accent/50"
              activeClassName="bg-accent text-primary font-medium"
            >
              <item.icon className="h-4 w-4" />
              {!collapsed && <span>{item.title}</span>}
            </NavLink>
          </SidebarMenuButton>
        ))}

        <Button
          variant="ghost"
          size={collapsed ? 'icon' : 'default'}
          className={collapsed ? 'w-full' : 'w-full justify-start gap-2'}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {!collapsed && (theme === 'dark' ? 'Light mode' : 'Dark mode')}
        </Button>

        <Button
          variant="ghost"
          size={collapsed ? 'icon' : 'default'}
          className={collapsed ? 'w-full text-destructive' : 'w-full justify-start gap-2 text-destructive hover:text-destructive'}
          onClick={signOut}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && 'Sign out'}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
