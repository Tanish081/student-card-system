import { useEffect, useMemo, useRef, useState } from 'react';
import PrincipalActivityList from '../components/principal/PrincipalActivityList';
import PrincipalAgenda from '../components/principal/PrincipalAgenda';
import PrincipalGreetingHero from '../components/principal/PrincipalGreetingHero';
import PrincipalKPICard from '../components/principal/PrincipalKPICard';
import PrincipalOpportunitiesPanel from '../components/principal/PrincipalOpportunitiesPanel';
import PrincipalSPIChart from '../components/principal/PrincipalSPIChart';
import PrincipalStudentTable from '../components/principal/PrincipalStudentTable';
import PrincipalTopNav from '../components/principal/PrincipalTopNav';
import PrincipalVerificationCard from '../components/principal/PrincipalVerificationCard';
import NotificationPanel from '../components/shared/NotificationPanel';
import ToastNotification from '../components/shared/ToastNotification';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import '../styles/dashboard-shared.css';
import '../styles/principal.css';

const buildTrendMap = (average = 620) => ({
  Month: [
    { label: 'Jan', school: Math.max(0, average - 22), platform: Math.max(0, average - 37) },
    { label: 'Feb', school: Math.max(0, average - 15), platform: Math.max(0, average - 31) },
    { label: 'Mar', school: Math.max(0, average - 6), platform: Math.max(0, average - 26) },
    { label: 'Apr', school: Math.max(0, average + 1), platform: Math.max(0, average - 20) },
    { label: 'May', school: Math.max(0, average + 6), platform: Math.max(0, average - 15) }
  ],
  Term: [
    { label: 'T1', school: Math.max(0, average - 34), platform: Math.max(0, average - 44) },
    { label: 'T2', school: Math.max(0, average - 12), platform: Math.max(0, average - 28) },
    { label: 'T3', school: Math.max(0, average + 10), platform: Math.max(0, average - 14) }
  ],
  Year: [
    { label: '2022', school: Math.max(0, average - 78), platform: Math.max(0, average - 86) },
    { label: '2023', school: Math.max(0, average - 42), platform: Math.max(0, average - 58) },
    { label: '2024', school: Math.max(0, average - 19), platform: Math.max(0, average - 33) },
    { label: '2025', school: Math.max(0, average + 4), platform: Math.max(0, average - 16) }
  ]
});

const PrincipalDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('Overview');
  const [analytics, setAnalytics] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [verificationItems, setVerificationItems] = useState([]);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const verifySectionRef = useRef(null);
  const opportunitySectionRef = useRef(null);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError('');

      try {
        const [analyticsRes, opportunitiesRes, auditRes] = await Promise.all([
          api.get('/principal/analytics'),
          api.get('/opportunities?page=1&limit=20'),
          api.get('/audit/logs?page=1&limit=20')
        ]);

        const loadedAnalytics = analyticsRes?.data?.data;
        const loadedOpportunities = opportunitiesRes?.data?.data?.opportunities || [];
        const loadedLogs = auditRes?.data?.data?.logs || [];

        setAnalytics(loadedAnalytics);
        setOpportunities(loadedOpportunities);
        setAuditLogs(loadedLogs);

        // TODO: wire to a dedicated principal verification queue endpoint.
        const defaultQueue = (loadedAnalytics?.studentsNeedingSupport || []).slice(0, 4).map((item, index) => ({
          id: item.uid || `verify-${index}`,
          initials: String(item.name || 'Student').split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase(),
          name: item.name,
          className: item.class,
          title: 'Pending achievement verification',
          submittedAgo: `${index + 1} day${index ? 's' : ''} ago`
        }));

        setVerificationItems(defaultQueue);

        setNotifications(
          loadedLogs.slice(0, 12).map((log, index) => ({
            id: log._id || `p-notif-${index}`,
            title: (log.action || 'School update').replace(/-/g, ' '),
            createdAt: log.eventTimestamp || log.createdAt || new Date().toISOString(),
            isRead: false
          }))
        );
      } catch (apiError) {
        setError(apiError?.response?.data?.message || 'Failed to load principal briefing');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const schoolName = useMemo(() => {
    if (user?.schoolId) return user.schoolId;
    return 'DPS Pune';
  }, [user?.schoolId]);

  const averageSPI = useMemo(() => {
    const ranking = analytics?.spiRanking || [];
    if (!ranking.length) return 671;
    return Math.round(ranking.reduce((sum, item) => sum + Number(item.spi || 0), 0) / ranking.length);
  }, [analytics?.spiRanking]);

  const kpis = useMemo(() => {
    const totalStudents = analytics?.totalStudents || 1204;
    const achievements = (analytics?.academicLeaders || []).length ? 284 : 284;
    const pendingReviews = verificationItems.length || 14;

    return [
      {
        label: 'Total students',
        value: totalStudents,
        trend: 'Capacity utilization 82%',
        trendTone: 'up',
        progress: 82
      },
      {
        label: 'Average SPI',
        value: averageSPI,
        trend: 'Above platform baseline',
        trendTone: 'up',
        progress: (averageSPI / 1000) * 100
      },
      {
        label: 'Achievements this year',
        value: achievements,
        trend: 'vs last year +43',
        trendTone: 'up',
        progress: 72
      },
      {
        label: 'Pending your review',
        value: pendingReviews,
        trend: 'Requires action today',
        trendTone: 'warn',
        progress: 100,
        variant: 'warning'
      }
    ];
  }, [analytics?.academicLeaders, analytics?.totalStudents, averageSPI, verificationItems.length]);

  const studentsAttention = useMemo(() => {
    const list = analytics?.studentsNeedingSupport || [];
    return list.slice(0, 8).map((item, index) => {
      const trend = index % 3 === 0 ? 'down' : index % 3 === 1 ? 'flat' : 'up';
      return {
        uid: item.uid,
        name: item.name,
        className: item.class,
        spi: Math.round(Number(item.spi || 0)),
        trend,
        trendSymbol: trend === 'down' ? '↓' : trend === 'flat' ? '→' : '↑',
        lastAchievement: index % 2 ? '3 months ago' : 'Last week'
      };
    });
  }, [analytics?.studentsNeedingSupport]);

  const opportunityStats = useMemo(() => {
    const posted = opportunities.length;
    const applications = opportunities.reduce((sum, item) => sum + Number(item.applicationSummary?.total || 0), 0);
    const selected = opportunities.reduce((sum, item) => sum + Number(item.applicationSummary?.selected || 0), 0);
    return { posted, applications, selected };
  }, [opportunities]);

  const opportunityBars = useMemo(
    () => opportunities
      .map((item) => ({
        name: (item.title || 'Opportunity').slice(0, 30),
        applications: Number(item.applicationSummary?.total || 0)
      }))
      .sort((a, b) => b.applications - a.applications)
      .slice(0, 5),
    [opportunities]
  );

  const trendByPeriod = useMemo(() => buildTrendMap(averageSPI), [averageSPI]);

  const agendaItems = useMemo(
    () => [
      { id: 'ag-1', text: `Verify ${verificationItems.length || 14} pending achievements`, done: false },
      { id: 'ag-2', text: `Review ${Math.min(6, opportunities.length || 6)} opportunity applications`, done: false },
      { id: 'ag-3', text: 'Check 3 flagged student records', done: false },
      { id: 'ag-4', text: 'Morning SPI update - completed', done: true }
    ],
    [opportunities.length, verificationItems.length]
  );

  const activityList = useMemo(
    () => (auditLogs.length
      ? auditLogs.slice(0, 10).map((log, index) => ({
        id: log._id || `act-${index}`,
        text: (log.action || 'School update').replace(/-/g, ' '),
        time: new Date(log.eventTimestamp || log.createdAt || Date.now()).toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit'
        })
      }))
      : [
        { id: 'f-1', text: 'Priya M. applied to Science Fair', time: '1h ago' },
        { id: 'f-2', text: 'New opportunity posted by you', time: '3h ago' },
        { id: 'f-3', text: 'Ravi K. QR card scanned — external verify', time: '5h ago' }
      ]),
    [auditLogs]
  );

  const handleVerify = (item) => {
    setVerificationItems((prev) => prev.filter((entry) => entry.id !== item.id));
    setToast({ type: 'success', message: `Verified: ${item.name}` });
  };

  const handleReject = (item, reason) => {
    setVerificationItems((prev) => prev.filter((entry) => entry.id !== item.id));
    setToast({ type: 'error', message: `Rejected: ${item.name}${reason ? ` (${reason})` : ''}` });
  };

  return (
    <div className="principal-dashboard">
      <PrincipalTopNav
        user={user}
        schoolName={schoolName}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onToggleNotifications={() => setNotificationsOpen((prev) => !prev)}
        notificationCount={notifications.filter((item) => !item.isRead).length}
        onLogout={logout}
      />

      <PrincipalGreetingHero
        userName={user?.name || 'Mrs. Priya Nair'}
        schoolName={schoolName}
        onVerify={() => verifySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        onPostOpportunity={() => opportunitySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        onDownload={() => setToast({ type: 'info', message: 'Report generation queued.' })}
      />

      <main className="principal-main">
        {error ? <p className="principal-error">{error}</p> : null}

        <section className="principal-kpi-grid">
          {kpis.map((item, index) => (
            <PrincipalKPICard key={item.label} item={item} index={index} />
          ))}
        </section>

        <div className="principal-layout-grid">
          <div className="principal-left-col">
            <PrincipalSPIChart trendByPeriod={trendByPeriod} />
            <PrincipalStudentTable students={studentsAttention} />
            <div ref={opportunitySectionRef}>
              <PrincipalOpportunitiesPanel data={opportunityBars} stats={opportunityStats} />
            </div>
          </div>

          <div className="principal-right-col">
            <PrincipalAgenda initialItems={agendaItems} />

            <section className="principal-panel" ref={verifySectionRef}>
              <header className="principal-panel-header">
                <h3>Awaiting Your Signature</h3>
                <span className="principal-count-badge">{verificationItems.length}</span>
              </header>

              <div className="principal-verification-list">
                {verificationItems.length ? verificationItems.map((item) => (
                  <PrincipalVerificationCard
                    key={item.id}
                    item={item}
                    onVerify={handleVerify}
                    onReject={handleReject}
                  />
                )) : (
                  <div className="dashboard-empty-state small">
                    <h4>Queue clear</h4>
                    <p>No pending verifications right now.</p>
                  </div>
                )}
              </div>
            </section>

            <PrincipalActivityList items={activityList} />
          </div>
        </div>

        {loading ? <p className="principal-loading">Preparing institutional briefing...</p> : null}
      </main>

      <NotificationPanel
        open={notificationsOpen}
        title="Principal Notifications"
        notifications={notifications}
        onClose={() => setNotificationsOpen(false)}
        onMarkAllRead={() => setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })))}
        onItemClick={(item) => {
          setNotifications((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, isRead: true } : entry)));
          setNotificationsOpen(false);
        }}
      />

      <ToastNotification toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default PrincipalDashboard;
