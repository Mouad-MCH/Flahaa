import { Bell, Menu } from 'lucide-react';
import { useAuthStore } from '../../store/authStore.js';
import { useFarmStore } from '../../store/farmStore.js';

const Navbar = ({ pageTitle, isMobile, onMenuClick}) => {
  const user = useAuthStore((s) => s.user);
  const farm = useFarmStore(state => state.farm)


  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-card px-5">
      <div className="flex items-center gap-3">
        {isMobile && (
          <button
            onClick={onMenuClick}
            className="rounded-lg p-1.5 text-ink-2 transition-colors hover:bg-sunken hover:text-ink"
          >
            <Menu size={18} />
          </button>
        )}

        <span className="text-sm font-semibold text-ink">{pageTitle}</span>

          <div>
            <span className="hidden text-ink-3 sm:inline">&middot;</span>
            <span className="hidden text-sm text-ink-2 sm:inline">{farm.name || user?.farm_name}</span>
          </div>
      </div>

      <div className='flex items-center gap-10'>
        <div className=' relative flex items-center justify-center rounded-lg border w-7 h-7 border-line'>
          <span className='absolute w-2 h-2 rounded-full bg-red-600 -top-0.5 -right-0.5'></span>
          <Bell size={16} className='text-ink-2 text-sm font-medium cp hover:text-ink' />
        </div>
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-field-soft text-xs font-bold text-field">
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div className="hidden leading-tight sm:block">
          <p className="text-xs font-semibold text-ink">{user?.name}</p>
          <p className="text-[10px] capitalize text-ink-3">{user?.role}</p>
        </div>
      </div>
      </div>
    </header>
  );
};

export default Navbar;
