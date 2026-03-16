import { useEffect, useState } from 'react';
import api from '../services/api';

const statusTone = (item) => {
  if (item.eligible) return '#166534';
  if (item.recommendation === 'almost-there') return '#b45309';
  return '#991b1b';
};

const EligibilityPanel = ({ uid }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [eligibility, setEligibility] = useState([]);

  useEffect(() => {
    const loadEligibility = async () => {
      if (!uid) return;

      setLoading(true);
      setError('');
      try {
        const response = await api.get(`/students/${uid}/eligibility`);
        setEligibility(response.data.data.eligibilityFlags || []);
      } catch (apiError) {
        setError(apiError?.response?.data?.message || 'Failed to load scheme eligibility');
      } finally {
        setLoading(false);
      }
    };

    loadEligibility();
  }, [uid]);

  return (
    <section className="card" style={{ marginTop: '1rem' }}>
      <h3 style={{ marginTop: 0 }}>Schemes You May Qualify For</h3>

      {loading ? <p>Loading eligibility...</p> : null}
      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}

      {!loading && !error && !eligibility.length ? <p>No scheme data available yet.</p> : null}

      {!loading && !error && eligibility.length ? (
        <div className="grid">
          {eligibility.map((item) => (
            <article key={item.schemeId} className="card" style={{ borderColor: '#dbeafe' }}>
              <h4 style={{ marginTop: 0, marginBottom: '0.4rem' }}>{item.schemeName}</h4>
              <p style={{ marginTop: 0, marginBottom: '0.55rem', color: statusTone(item), fontWeight: 600 }}>
                {item.eligible ? 'Eligible' : item.recommendation === 'almost-there' ? 'Almost there' : 'Not eligible'}
              </p>
              <p style={{ marginTop: 0, marginBottom: '0.5rem' }}>
                <strong>SPI:</strong> {item.currentSPI} / {item.requiredSPI}
              </p>
              <div style={{ height: '8px', borderRadius: '999px', background: '#e2e8f0', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.max(0, Math.min(100, item.progressPercent || 0))}%`,
                    height: '100%',
                    background: item.eligible ? '#16a34a' : '#f59e0b'
                  }}
                />
              </div>
              <p style={{ marginTop: '0.55rem', marginBottom: '0.7rem', color: '#475569', fontSize: '0.9rem' }}>
                {item.reason}
              </p>
              <a href={item.portalUrl} target="_blank" rel="noreferrer" style={{ color: '#1d4ed8' }}>
                Visit official portal
              </a>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
};

export default EligibilityPanel;
