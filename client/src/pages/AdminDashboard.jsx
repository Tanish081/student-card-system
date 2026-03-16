import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminTopBar from '../components/admin/AdminTopBar';
import NotificationPanel from '../components/shared/NotificationPanel';
import SectionLoader from '../components/shared/SectionLoader';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import '../styles/dashboard-shared.css';
import '../styles/admin.css';

const OverviewSection = lazy(() => import('../components/admin/sections/OverviewSection'));
const StudentsSection = lazy(() => import('../components/admin/sections/StudentsSection'));
const SchoolsSection = lazy(() => import('../components/admin/sections/SchoolsSection'));
const AchievementsSection = lazy(() => import('../components/admin/sections/AchievementsSection'));
const OpportunitiesSection = lazy(() => import('../components/admin/sections/OpportunitiesSection'));
const SchemeEligibilitySection = lazy(() => import('../components/admin/sections/SchemeEligibilitySection'));
const AuditLogSection = lazy(() => import('../components/admin/sections/AuditLogSection'));
const SettingsSection = lazy(() => import('../components/admin/sections/SettingsSection'));

const NAV_ITEMS = [
  { key: 'overview', label: 'Overview', icon: 'overview' },
  { key: 'students', label: 'Students', icon: 'students' },
  { key: 'schools', label: 'Schools', icon: 'schools' },
  { key: 'achievements', label: 'Achievements', icon: 'achievements' },
  { key: 'opportunities', label: 'Opportunities', icon: 'opportunities' },
  { key: 'schemes', label: 'Scheme Eligibility', icon: 'schemes' },
  { key: 'audit', label: 'Audit Log', icon: 'audit' },
  { key: 'settings', label: 'Settings', icon: 'settings' }
];

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const sectionFromUrl = searchParams.get('section');
  const [activeSection, setActiveSection] = useState(() => {
    if (sectionFromUrl && NAV_ITEMS.some((item) => item.key === sectionFromUrl)) {
      return sectionFromUrl;
    }
    return 'overview';
  });
  const [sectionContext, setSectionContext] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [compactSidebar, setCompactSidebar] = useState(false);

  useEffect(() => {
    const onResize = () => setCompactSidebar(window.innerWidth <= 1024 && window.innerWidth > 768);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (sectionFromUrl && NAV_ITEMS.some((item) => item.key === sectionFromUrl) && sectionFromUrl !== activeSection) {
      setActiveSection(sectionFromUrl);
      return;
    }

    if (!sectionFromUrl && activeSection !== 'overview') {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('section', activeSection);
        return next;
      }, { replace: true });
    }
  }, [activeSection, sectionFromUrl, setSearchParams]);

  useEffect(() => {
    const controller = new AbortController();

    const loadNotifications = async () => {
      try {
        const response = await api.get('/admin/overview-activity', {
          params: { limit: 15 },
          signal: controller.signal
        });
        const items = response.data?.data?.items || [];
        setNotifications(
          items.map((item) => ({
            id: item.id,
            title: String(item.action || 'audit-update').replace(/[-_]/g, ' '),
            message: `${item.entityType || 'System'} update`,
            createdAt: item.timestamp,
            isRead: false
          }))
        );
      } catch (_error) {
        setNotifications([]);
      }
    };

    loadNotifications();
    return () => controller.abort();
  }, []);

  const badges = useMemo(
    () => ({
      students: '20/page',
      achievements: 'Pending',
      audit: 'Live'
    }),
    []
  );

  const navigateToSection = (section, context) => {
    if (!NAV_ITEMS.some((item) => item.key === section)) {
      return;
    }

    setActiveSection(section);
    setSectionContext(context || {});
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('section', section);
      return next;
    }, { replace: true });

    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (_error) {
      window.scrollTo(0, 0);
    }
  };

  const renderSection = () => {
    if (activeSection === 'students') return <StudentsSection context={sectionContext} />;
    if (activeSection === 'schools') return <SchoolsSection />;
    if (activeSection === 'achievements') return <AchievementsSection initialTab={sectionContext?.tab || 'pending'} />;
    if (activeSection === 'opportunities') return <OpportunitiesSection />;
    if (activeSection === 'schemes') return <SchemeEligibilitySection />;
    if (activeSection === 'audit') return <AuditLogSection />;
    if (activeSection === 'settings') return <SettingsSection />;
    return <OverviewSection user={user} onNavigate={navigateToSection} />;
  };

  return (
    <div className="admin-dashboard">
      <AdminSidebar
        items={NAV_ITEMS}
        activeSection={activeSection}
        onNavigate={navigateToSection}
        badges={badges}
        compact={compactSidebar}
      />

      <div className={`admin-main ${compactSidebar ? 'is-compact' : ''}`}>
        <AdminTopBar
          user={user}
          breadcrumb={NAV_ITEMS.find((item) => item.key === activeSection)?.label || 'Overview'}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenSearch={() => navigateToSection('students')}
          notificationCount={notifications.filter((item) => !item.isRead).length}
          onToggleNotifications={() => setNotificationsOpen((prev) => !prev)}
          onLogout={logout}
        />

        <main className="admin-content">
          <Suspense fallback={<SectionLoader rows={8} />}>
            {renderSection()}
          </Suspense>
        </main>
      </div>

      <NotificationPanel
        open={notificationsOpen}
        title="Admin Notifications"
        notifications={notifications}
        onClose={() => setNotificationsOpen(false)}
        onMarkAllRead={() => setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })))}
        onItemClick={(item) => {
          setNotifications((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, isRead: true } : entry)));
          setNotificationsOpen(false);
        }}
      />
    </div>
  );
};

export default AdminDashboard;
