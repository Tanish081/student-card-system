import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';

const PublicVerifyPage = () => {
  const { uid } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    const loadVerification = async () => {
      if (!uid) return;

      setLoading(true);
      setError('');
      try {
        const response = await api.get(`/students/verify/${uid}`);
        setData(response.data.data);
      } catch (apiError) {
        setError(apiError?.response?.data?.message || 'Failed to verify student');
      } finally {
        setLoading(false);
      }
    };

    loadVerification();
  }, [uid]);

  return (
    <div className="verify-root">
      <div className="verify-panel">
        <p className="verify-eyebrow">Digital Bharat Civic Trust</p>
        <h1 style={{ marginTop: 0 }}>Student Identity Verification</h1>
        <p style={{ color: '#475569' }}>
          This page confirms civic identity details for a student UID shared through official school channels.
        </p>

        {loading ? <p>Verifying...</p> : null}
        {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}

        {!loading && !error && data ? (
          <section className="card" style={{ marginTop: '1rem', borderColor: '#c7d2fe' }}>
            <h3 style={{ marginTop: 0, marginBottom: '0.45rem' }}>{data.name}</h3>
            <p style={{ margin: '0.2rem 0' }}><strong>UID:</strong> {data.uid}</p>
            <p style={{ margin: '0.2rem 0' }}><strong>School:</strong> {data.school}</p>
            <p style={{ margin: '0.2rem 0' }}><strong>Class:</strong> {data.class}{data.section}</p>
            <p style={{ margin: '0.2rem 0' }}><strong>SPI:</strong> {data.spi} ({data.spiCategory})</p>
            <p style={{ margin: '0.2rem 0' }}><strong>Achievements:</strong> {data.achievementCount}</p>
            <p style={{ margin: '0.2rem 0' }}><strong>Status:</strong> {data.verificationStatus}</p>
            <p style={{ margin: '0.2rem 0' }}><strong>Issuing Authority:</strong> {data.issuingPrincipalName}</p>
          </section>
        ) : null}

        <p style={{ marginTop: '1rem' }}>
          <Link to="/login" style={{ color: '#1d4ed8' }}>Back to login</Link>
        </p>
      </div>
    </div>
  );
};

export default PublicVerifyPage;
