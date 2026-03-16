import { useState } from 'react';
import OpportunityApplicationsReview from '../../OpportunityApplicationsReview';
import { useAdminSectionData } from '../../../hooks/admin/useAdminSectionData';
import SectionLoader from '../../shared/SectionLoader';
import ErrorState from '../../shared/ErrorState';
import EmptyState from '../../shared/EmptyState';

const tabs = ['all', 'applications', 'analytics'];

const OpportunitiesSection = () => {
  const [activeTab, setActiveTab] = useState('all');
  const { data, loading, error, refetch } = useAdminSectionData({
    endpoint: '/admin/sections/opportunities',
    cachePrefix: 'admin-opportunities',
    ttlMs: 30000
  });

  return (
    <section className="section-content">
      <header className="section-header card-default">
        <h2>Opportunities</h2>
        <div className="tab-row">
          {tabs.map((tab) => (
            <button
              type="button"
              key={tab}
              className={activeTab === tab ? 'is-active' : ''}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'all' ? 'All Opportunities' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </header>

      {loading ? <SectionLoader rows={6} /> : null}
      {error ? <ErrorState message={error} retry={refetch} /> : null}

      {!loading && !error ? (
        <>
          {activeTab === 'all' ? (
            <div className="table-wrap card-default">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Event Type</th>
                    <th>Status</th>
                    <th>Deadline</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.opportunities || []).length ? (
                    (data?.opportunities || []).map((row) => (
                      <tr key={row._id}>
                        <td>{row.title}</td>
                        <td>{row.category}</td>
                        <td>{row.eventType}</td>
                        <td>{row.status}</td>
                        <td>{new Date(row.deadline).toLocaleDateString('en-IN')}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5}><EmptyState title="No opportunities" message="No opportunities available right now." /></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : null}

          {activeTab === 'applications' ? <OpportunityApplicationsReview /> : null}

          {activeTab === 'analytics' ? (
            <div className="analytics-grid">
              <article className="card-default"><h3>Applied</h3><strong>{data?.analytics?.applied || 0}</strong></article>
              <article className="card-default"><h3>Shortlisted</h3><strong>{data?.analytics?.shortlisted || 0}</strong></article>
              <article className="card-default"><h3>Selected</h3><strong>{data?.analytics?.selected || 0}</strong></article>
              <article className="card-default"><h3>Rejected</h3><strong>{data?.analytics?.rejected || 0}</strong></article>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
};

export default OpportunitiesSection;
