import { useEffect, useState } from 'react';
import api from '../services/api';

const formatDate = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString();
};

const OpportunityFeed = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState({});

  const loadFeed = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await api.get('/opportunities/feed');
      setOpportunities(response.data.data.opportunities || []);
    } catch (apiError) {
      setError(apiError?.response?.data?.message || 'Failed to load opportunity feed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);

  const handleApply = async (opportunityId) => {
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

                <button type="button" onClick={() => handleApply(item.id)}>
                  {expandedState.open ? 'Hide Details' : 'Apply'}
                </button>

                {expandedState.open && expandedState.details ? (
                  <div style={{ marginTop: '0.8rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.7rem' }}>
                    <p style={{ marginTop: 0 }}>{expandedState.details.description}</p>
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
    </section>
  );
};

export default OpportunityFeed;
