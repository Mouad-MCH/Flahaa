import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useIsMobile } from '../../hooks/useIsMobile.js';
import { useAuthStore } from '../../store/authStore.js';
import { useFarmStore } from '../../store/farmStore.js';
import { getMyFarms } from '../../services/farmService.js';
import { navItems } from '../../utils/constant.js';

const MainLayout = () => {
  const location = useLocation();
  const isMobile = useIsMobile();

  const [open, setOpen] = useState(!isMobile);

  useEffect(() => {
    setOpen(!isMobile);
  }, [isMobile]);

  const pageTitle = navItems.find(
    (item) => location.pathname === item.to || (item.to !== '/dashboard' && location.pathname.startsWith(item.to + '/'))
  )?.label ?? 'Tableau de bord';

  return (
    <div className="flex h-screen overflow-hidden bg-paper">
      {isMobile && open && (
        <div className="fixed inset-0 z-40 bg-black/55" onClick={() => setOpen(false)} />
      )}

      {!isMobile && (
        <Sidebar
          open={open}
          isMobile={false}
          onCollapseToggle={() => setOpen((p) => !p)}
        />
      )}

      {isMobile && (
        <div
          className={`fixed left-0 top-0 z-50 h-full transition-transform duration-200 ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <Sidebar
            open={open}
            isMobile
            onMobileClose={() => setOpen(false)}
          />
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar
          pageTitle={pageTitle}
          isMobile={isMobile}
          onMenuClick={() => setOpen(true)}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
