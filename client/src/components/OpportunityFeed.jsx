import { useEffect, useState } from 'react';
import api from '../services/api';

const formatDate = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString();
};

const isImageMime = (mimeType = '') => String(mimeType).startsWith('image/');

const OpportunityFeed = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadFeed = async (nextPage = page) => {
    setError('');
    setLoading(true);

    try {
      const response = await api.get('/opportunities/feed', {
        params: { page: nextPage, limit: 8 }
      });
      const payload = response.data.data || {};
      setOpportunities(payload.opportunities || []);
      setPage(payload.page || nextPage);
      setTotalPages(payload.totalPages || 1);
    } catch (apiError) {
      setError(apiError?.response?.data?.message || 'Failed to load opportunity feed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed(1);
  }, []);

  const handleApply = async (opportunityId) => {
    try {
      await api.post(`/opportunities/${opportunityId}/apply`);
      await loadFeed();
    } catch (apiError) {
      setError(apiError?.response?.data?.message || 'Failed to apply for opportunity');
    }
  };

  const handleViewDetails = async (opportunityId) => {
    try {
      const response = await api.get(`/opportunities/${opportunityId}`);
      const details = response.data.data;

      setExpanded((prev) => ({
        ...prev,
        [opportunityId]: {
          open: !prev[opportunityId]?.open,
          details
        }
      }));
    } catch (apiError) {
      setError(apiError?.response?.data?.message || 'Failed to load opportunity details');
    }
  };

  return (
    <section className="card" style={{ marginTop: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
        <h3 style={{ marginTop: 0, marginBottom: 0 }}>Opportunity Feed</h3>
        <button type="button" className="secondary" onClick={loadFeed} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}

      {loading ? (
        <p>Loading opportunities...</p>
      ) : opportunities.length ? (
        <div className="grid" style={{ marginTop: '1rem' }}>
          {opportunities.map((item) => {
            const expandedState = expanded[item.id] || { open: false, details: null };

            return (
              <article key={item.id} className="card" style={{ borderColor: '#dbeafe' }}>
                <h4 style={{ marginTop: 0, marginBottom: '0.35rem' }}>{item.title}</h4>
                <p style={{ marginTop: 0, marginBottom: '0.6rem', color: '#475569' }}>
                  {item.eventType} • {item.category}
                </p>
                <p style={{ marginTop: 0, marginBottom: '0.5rem' }}>
                  <strong>Deadline:</strong> {formatDate(item.deadline)}
                </p>
                <p style={{ marginTop: 0, marginBottom: '0.5rem' }}>
                  <strong>Success Probability:</strong> {item.successProbability}%
                </p>
                <p style={{ marginTop: 0, marginBottom: '0.9rem' }}>
                  <strong>Relevance Score:</strong> {item.relevanceScore}
                </p>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => handleApply(item.id)}
                    disabled={item.hasApplied}
                    className={item.hasApplied ? 'secondary' : undefined}
                  >
                    {item.hasApplied ? `Applied (${item.applicationStatus || 'applied'})` : 'Apply'}
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => handleViewDetails(item.id)}
                  >
                    {expandedState.open ? 'Hide Details' : 'View Details'}
                  </button>
                </div>

                {expandedState.open && expandedState.details ? (
                  <div style={{ marginTop: '0.8rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.7rem' }}>
                    <p style={{ marginTop: 0 }}>{expandedState.details.description}</p>

                    {expandedState.details.attachments?.length ? (
                      <div style={{ marginBottom: '0.6rem' }}>
                        <p style={{ margin: '0 0 0.4rem', fontWeight: 600 }}>Attachments</p>
                        <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                          {expandedState.details.attachments.map((attachment, index) => (
                            <li key={`${attachment.fileName}-${index}`}>
                              <a
                                href={attachment.fileUrl || attachment.dataUrl}
                                target="_blank"
                                rel="noreferrer"
                                download={attachment.fileName}
                              >
                                {attachment.fileName}
                              </a>{' '}
                              ({attachment.mimeType})
                              {isImageMime(attachment.mimeType) ? ' - image preview available' : ''}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    <p style={{ margin: 0, color: '#334155' }}>
                      Contact: {expandedState.details.postedByName || expandedState.details.role}
                    </p>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : (
        <p style={{ marginTop: '0.9rem' }}>No active opportunities are available for your class right now.</p>
      )}

      {totalPages > 1 ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
          <button
            type="button"
            className="secondary"
            onClick={() => loadFeed(page - 1)}
            disabled={loading || page <= 1}
          >
            Previous
          </button>
          <small style={{ color: '#64748b' }}>Page {page} of {totalPages}</small>
          <button
            type="button"
            className="secondary"
            onClick={() => loadFeed(page + 1)}
            disabled={loading || page >= totalPages}
          >
            Next
          </button>
        </div>
      ) : (
        null
      )}
    </section>
  );
};

export default OpportunityFeed;
