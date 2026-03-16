import { useMemo } from 'react';
import { useAdminStats } from '../../../hooks/admin/useAdminStats';
import { useOverviewActivity } from '../../../hooks/admin/useOverviewActivity';
import { SkeletonCard, SkeletonRow } from '../../shared/Skeleton';
import ErrorState from '../../shared/ErrorState';

const KPI_CONFIG = [
  { key: 'totalStudents', label: 'Total students', color: 'teal', section: 'students' },
  { key: 'verifiedAchievements', label: 'Achievements verified', color: 'green', section: 'achievements' },
  { key: 'schemeEligible', label: 'Scheme eligible', color: 'blue', section: 'schemes' },
  { key: 'activeSchools', label: 'Active schools', color: 'teal', section: 'schools' },
  { key: 'pendingReviews', label: 'Pending reviews', color: 'amber', section: 'achievements' },
  { key: 'qrVerifications', label: 'QR verifications', color: 'green', section: 'audit' }
];

const formatTimestamp = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const OverviewSection = ({ user, onNavigate }) => {
  const stats = useAdminStats();
  const activity = useOverviewActivity();

  const greeting = useMemo(() => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good morning';
    if (hours < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  if (stats.error) {
    return <ErrorState message={stats.error} retry={stats.refetch} />;
  }

  return (
    <section className="section-content">
      <header className="overview-header section-gap card-default">
        <h1>{greeting}, {user?.name || 'Admin'}</h1>
        <p>{new Date().toLocaleString('en-IN')}</p>
      </header>

      <section className="kpi-grid section-gap">
        {stats.loading
          ? Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={index} />)
          : KPI_CONFIG.map((item) => (
            <button
              type="button"
              key={item.key}
              className={`kpi-card tone-${item.color}`}
              onClick={() => onNavigate(item.section, item.section === 'achievements' ? { tab: 'pending' } : undefined)}
            >
              <span>{item.label}</span>
              <strong>{Number(stats.data?.[item.key] || 0).toLocaleString('en-IN')}</strong>
              <em>Open {item.section}</em>
            </button>
          ))}
      </section>

      <section className="overview-split section-gap card-gap">
        <article className="card-default quick-actions">
          <h2>Quick Actions</h2>
          <div>
            <button type="button" onClick={() => onNavigate('schools')}>+ Add School</button>
            <button type="button" onClick={() => onNavigate('achievements', { tab: 'pending' })}>Verify Batch</button>
            <button type="button" onClick={() => onNavigate('students', { action: 'export' })}>Download Report</button>
            <button type="button" onClick={() => onNavigate('audit')}>Run SPI Recalc</button>
          </div>
        </article>

        <article className="card-accent pending-attention">
          <h2>Pending Attention</h2>
          <button type="button" onClick={() => onNavigate('achievements', { tab: 'pending' })}>
            {Number(stats.data?.pendingReviews || 0).toLocaleString('en-IN')} achievements await
          </button>
          <button type="button" onClick={() => onNavigate('opportunities')}>
            {Number(stats.data?.applicationsOpen || 0).toLocaleString('en-IN')} applications open
          </button>
          <button type="button" onClick={() => onNavigate('schools')}>
            {Number(stats.data?.flaggedSchools || 0).toLocaleString('en-IN')} schools flagged
          </button>
        </article>
      </section>

      <section className="card-muted recent-activity section-gap">
        <h2>Recent Activity</h2>
        {activity.loading ? (
          <div className="section-loader">{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}</div>
        ) : activity.error ? (
          <ErrorState message={activity.error} retry={activity.refetch} />
        ) : (
          <ul>
            {(activity.items || []).slice(0, 5).map((item) => (
              <li key={item.id}>
                <span>{String(item.action || 'event').replace(/[-_]/g, ' ')}</span>
                <time>{formatTimestamp(item.timestamp)}</time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
};

export default OverviewSection;
