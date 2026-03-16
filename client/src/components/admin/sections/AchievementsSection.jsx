import { useEffect, useMemo, useState } from 'react';
import { useAchievementsSection } from '../../../hooks/admin/useAchievementsSection';
import SectionLoader from '../../shared/SectionLoader';
import ErrorState from '../../shared/ErrorState';
import EmptyState from '../../shared/EmptyState';

const TABS = ['all', 'pending', 'verified', 'rejected'];

const AchievementsSection = ({ initialTab = 'pending' }) => {
  const [tab, setTab] = useState(initialTab);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [rejectingId, setRejectingId] = useState('');
  const [reason, setReason] = useState('');

  const params = useMemo(() => ({ status: tab, page, limit: 20 }), [tab, page]);
  const { data, loading, error, refetch, updateStatus, bulkUpdateStatus } = useAchievementsSection(params);
  const rows = data?.achievements || [];

  const toggleSelection = (id) => {
    setSelectedIds((previous) => (previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id]));
  };

  const verifyOne = async (achievementId) => {
    await updateStatus({ achievementId, status: 'verified' });
  };

  const rejectOne = async (achievementId) => {
    if (!reason.trim()) return;
    await updateStatus({ achievementId, status: 'rejected', reason });
    setReason('');
    setRejectingId('');
  };

  const verifyBulk = async () => {
    if (!selectedIds.length) return;
    await bulkUpdateStatus({ achievementIds: selectedIds, status: 'verified' });
    setSelectedIds([]);
  };

  useEffect(() => {
    setTab(initialTab);
    setPage(1);
  }, [initialTab]);

  return (
    <section className="section-content">
      <header className="section-header card-default">
        <h2>Achievements</h2>
        <div className="tab-row">
          {TABS.map((tabValue) => (
            <button
              type="button"
              key={tabValue}
              className={tab === tabValue ? 'is-active' : ''}
              onClick={() => {
                setTab(tabValue);
                setPage(1);
              }}
            >
              {tabValue}
            </button>
          ))}
        </div>
      </header>

      <div className="bulk-actions card-muted">
        <label>
          <input
            type="checkbox"
            checked={selectedIds.length > 0 && selectedIds.length === rows.length}
            onChange={(event) => {
              setSelectedIds(event.target.checked ? rows.map((row) => row._id) : []);
            }}
          />
          Select all
        </label>
        <button type="button" onClick={verifyBulk} disabled={!selectedIds.length}>Verify Selected</button>
      </div>

      {loading ? <SectionLoader rows={8} /> : null}
      {error ? <ErrorState message={error} retry={refetch} /> : null}

      {!loading && !error ? (
        !rows.length ? (
          <EmptyState title="No achievements found" message="Try another status tab." />
        ) : (
          <div className="table-wrap card-default">
            <table>
              <thead>
                <tr>
                  <th />
                  <th>Student</th>
                  <th>School</th>
                  <th>Achievement</th>
                  <th>Category</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row._id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(row._id)}
                        onChange={() => toggleSelection(row._id)}
                      />
                    </td>
                    <td>{row.studentName}</td>
                    <td>{row.schoolName}</td>
                    <td>{row.eventName}</td>
                    <td>{row.category}</td>
                    <td>{new Date(row.createdAt).toLocaleDateString('en-IN')}</td>
                    <td>{row.statusLabel}</td>
                    <td>
                      <div className="row-actions visible">
                        <button type="button" onClick={() => verifyOne(row._id)}>Verify</button>
                        <button type="button" className="danger" onClick={() => setRejectingId(row._id)}>Reject</button>
                      </div>
                      {rejectingId === row._id ? (
                        <div className="reject-reason">
                          <input
                            value={reason}
                            onChange={(event) => setReason(event.target.value)}
                            placeholder="Reason"
                          />
                          <button type="button" onClick={() => rejectOne(row._id)}>Submit</button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : null}
    </section>
  );
};

export default AchievementsSection;
