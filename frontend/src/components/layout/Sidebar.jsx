import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, X, ChevronLeft, ChevronRight, Sun, Moon, Settings, ChevronsUpDown, Repeat } from 'lucide-react';
import { navItems } from '../../utils/constant.js';
import { useAuthStore } from '../../store/authStore.js';
import { useThemeStore } from '../../store/themeStore.js';
import { useFarmStore } from '../../store/farmStore.js';

const Sidebar = ({ open, isMobile, onCollapseToggle, onMobileClose }) => {
  const { user, logout } = useAuthStore();
  const {toggleTheme, isDark} = useThemeStore()
  const clearActiveFarm = useFarmStore((state) => state.clearActiveFarm);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);



  const visibleItems = navItems.filter((item) => item.roles.includes(user?.role))
  const expanded = open || isMobile
  const isAdmin = user?.role === "admin"



  return (
    <aside
      className={`flex h-full shrink-0 flex-col overflow-hidden border-r border-line bg-card transition-[width] duration-200 ${
        expanded ? 'w-64' : "w-16"
      }`}
    >

      <div
        className={ `flex h-14 shrink-0 items-center border-b border-line px-3 ${
          expanded ? 'justify-between' : 'justify-center'
        }` }
      >

        {
          expanded && (
            <div className="flex items-center gap-2">
              <div className='flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-field-soft'>
                <img src="/icons/Logo.png" alt="Logo" className="h-4 w-4" />
              </div>

              <span className="whitespace-nowrap text-sm font-bold text-ink">Flahaa</span>
            </div>
          )
        }

        {
          !isMobile ? (
            <button
              onClick={onCollapseToggle}
              title={open ? "Reduce" : "Expand"}
              className='shrink-0 rounded-lg p-1.5 text-ink-3 transition-colors hover:bg-sunken hover:text-ink'
            >
              {
                open ? <ChevronLeft size={16} /> : <ChevronRight size={16} />
              }
            </button>
          ): (
            <button
              onClick={onMobileClose}
              className='ml-auto shrink-0 rounded-lg p-1.5 text-ink-3 transition-colors hover:bg-sunken hover:text-ink'
            >
              <X size={16}/>
            </button>
          )
        }

      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-hidden px-2 py-3">
        {
          visibleItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => { if(isMobile) onMobileClose?.(); }}
              title={!expanded ? label : undefined}
              className={({ isActive }) => 
                `sidebar-link ${!expanded ? 'sidebar-link-collapsed' : '' } ${isActive ? 'sidebar-link-active' : ""}`
              }
            >
              <Icon size={18} className="shrink-0" />
              { expanded && <span className='truncate'>{label}</span> }
            </NavLink>
          ))
        }
      </nav>

      {/* Theme toggle */}
      <div className="border-t border-line px-2 py-3">
        {expanded ? (
          <>
            <p className="mb-2 flex items-center gap-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-ink-3">
              <Settings size={10} /> Paramètres
            </p>
            <div className="flex items-center justify-between rounded-lg border border-line px-3 py-2">
              <div className="flex items-center gap-2">
                {isDark ? <Moon size={13} className="text-ink-2" /> : <Sun size={13} className="text-ink-2" />}
                <span className="text-xs font-medium text-ink-2">{isDark ? 'Sombre' : 'Clair'}</span>
              </div>
              <button
                onClick={toggleTheme}
                aria-label="Basculer le thème"
                className={`relative h-4.5 w-8.5 shrink-0 rounded-full transition-colors ${
                  isDark ? 'bg-field-soft' : 'bg-field'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-card transition-all ${
                    isDark ? 'left-4.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={toggleTheme}
            title={isDark ? 'Mode clair' : 'Mode sombre'}
            className="sidebar-icon-btn"
          >
            {isDark ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        )}
      </div>

      <div className='relative border-t border-line px-2 pb-3 pt-1'>

        {
          accountMenuOpen && (
            <div
              className={`absolute bottom-full mb-1 overflow-hidden rounded-lg border border-line bg-card shadow-lg ${
                expanded ? 'left-2 right-2' : 'left-full ml-1 w-44'
              }`}
            >
              <button
                onClick={clearActiveFarm}
                className='flex cp items-center w-full gap-2.5 px-3 py-2.5 text-left text-sm font-medium text-ink-2 transition-colors hover:bg-sunken hover:text-ink'
              >
                <Repeat size={16}  className='shrink-0' />
                <span>Switch farm</span>
              </button>

            <button
              onClick={logout}
              className="flex cp w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium text-ink-3 transition-colors hover:bg-absent-soft hover:text-absent"
            >
              <LogOut size={16} className="shrink-0" />
              <span>Logout</span>
            </button>

            </div>
          )
        }

        {
          isAdmin ? (
            <button
              onClick={() => setAccountMenuOpen(!accountMenuOpen)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-3 transition-colors hover:bg-sunken hover:text-ink ${
                !expanded ? 'justify-center px-2.5': "justify-between"
              }`}
            >
              <span className='flex items-center gap-2.5'>
                <LogOut size={17} className="shrink-0" />
                {
                  expanded && <span>Account</span>
                }
              </span>
              {
                expanded && <ChevronsUpDown size={14} className="shrink-0" />
              }
            </button>
          ) : (
            <button
              onClick={logout}
              title={!expanded ? 'Logout': undefined}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-3 transition-colors hover:bg-absent-soft hover:text-absent cp ${
                !expanded ? 'justify-center px-2.5' : ''
              }`}
            >
              <LogOut size={17} className="shrink-0" />
              {expanded && <span>Logout</span>}
            </button>
          )
        }


      </div>

      

    </aside>
  );

};

export default Sidebar;
