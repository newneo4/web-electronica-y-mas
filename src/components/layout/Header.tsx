import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Search, Sun } from 'lucide-react';
import { useUIStore } from '@/app/store/useUIStore';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { UserNav } from '@/components/layout/UserNav';
import { RoleSwitcher } from '@/features/auth/components/RoleSwitcher';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function Header() {
  const theme = useUIStore((state) => state.theme);
  const toggleTheme = useUIStore((state) => state.toggleTheme);
  const [quickQuery, setQuickQuery] = useState('');
  const navigate = useNavigate();

  const handleQuickSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const term = quickQuery.trim().toLowerCase();
    if (!term) return;
    if (term.includes('cli') || term.includes('ruc')) {
      navigate('/admin/clients');
    } else if (term.includes('tec')) {
      navigate('/admin/technicians');
    } else if (term.includes('plan')) {
      navigate('/admin/service-plans');
    } else if (term.includes('age') || term.includes('prog')) {
      navigate('/admin/schedule');
    } else if (term.includes('mon') || term.includes('vivo')) {
      navigate('/admin/monitoring');
    } else if (term.includes('rep')) {
      navigate('/admin/reports');
    } else if (term.includes('user') || term.includes('usu')) {
      navigate('/admin/users');
    } else if (term.includes('conf') || term.includes('set')) {
      navigate('/admin/settings');
    } else {
      navigate('/admin/dashboard');
    }
    setQuickQuery('');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border bg-card/90 px-6 backdrop-blur-sm">
      {/* Left: Dynamic Breadcrumbs */}
      <div className="flex items-center gap-4">
        <Breadcrumbs />
      </div>

      {/* Right: Quick Search, Dev Role Switcher, Theme Toggle, UserNav */}
      <div className="flex items-center gap-3">
        <form
          onSubmit={handleQuickSearch}
          className="relative hidden w-64 xl:block"
        >
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#78909C]" />
          <Input
            type="search"
            value={quickQuery}
            onChange={(e) => setQuickQuery(e.target.value)}
            placeholder="Buscar módulo o SKU..."
            className="h-9 pl-9 pr-10 text-[12px]"
          />
          <kbd className="pointer-events-none absolute right-2.5 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-[#78909C] sm:flex">
            ↵
          </kbd>
        </form>

        <RoleSwitcher />

        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          title={
            theme === 'light'
              ? 'Cambiar a modo oscuro (#1F2926)'
              : 'Cambiar a modo claro (#F4F6F6)'
          }
          className="h-9 w-9"
        >
          {theme === 'light' ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4 text-[#E29528]" />
          )}
        </Button>

        <UserNav />
      </div>
    </header>
  );
}
