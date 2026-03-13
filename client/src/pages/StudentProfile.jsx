import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import StudentCard from '../components/StudentCard';
import SPIGraph from '../components/SPIGraph';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

const StudentProfile = () => {
  const { uid } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [spi, setSpi] = useState(null);
  const [error, setError] = useState('');
  const [assetError, setAssetError] = useState('');
  const [assetMessage, setAssetMessage] = useState('');
  const [qrPreviewUrl, setQrPreviewUrl] = useState('');
  const [isDownloadingCard, setIsDownloadingCard] = useState(false);
  const [isLoadingQr, setIsLoadingQr] = useState(false);

  const resolvedUID = useMemo(() => {
    if (uid === 'me' && user?.role === 'student') {
      return user.linkedStudentUID;
    }
    return uid;
  }, [uid, user]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!resolvedUID) return;
      try {
        const [profileRes, spiRes] = await Promise.all([
          api.get(`/students/${resolvedUID}`),
          api.get(`/spi/student/${resolvedUID}`)
        ]);

        setProfile(profileRes.data.data);
        setSpi(spiRes.data.data);
      } catch (apiError) {
        setError(apiError?.response?.data?.message || 'Failed to load student profile');
      }
    };

    loadProfile();
  }, [resolvedUID]);

  useEffect(
    () => () => {
      if (qrPreviewUrl) {
        URL.revokeObjectURL(qrPreviewUrl);
      }
    },
    [qrPreviewUrl]
  );

  const handleDownloadCard = async () => {
    if (!resolvedUID) return;

    setAssetError('');
    setAssetMessage('');
    setIsDownloadingCard(true);

    try {
      const response = await api.get(`/student/${resolvedUID}/card`, {
        responseType: 'blob'
      });

      const blobUrl = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = `${resolvedUID}-student-card.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(blobUrl);

      setAssetMessage('Student card downloaded successfully.');
    } catch (apiError) {
      setAssetError(apiError?.response?.data?.message || 'Failed to download student card');
    } finally {
      setIsDownloadingCard(false);
    }
  };

  const handleViewQr = async () => {
    if (!resolvedUID) return;

    setAssetError('');
    setAssetMessage('');
    setIsLoadingQr(true);

    try {
      const response = await api.get(`/student/${resolvedUID}/qrcode`, {
        responseType: 'blob'
      });

      const nextUrl = URL.createObjectURL(response.data);
      setQrPreviewUrl((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return nextUrl;
      });
      setAssetMessage('QR code loaded.');
    } catch (apiError) {
      setAssetError(apiError?.response?.data?.message || 'Failed to load QR code');
    } finally {
      setIsLoadingQr(false);
    }
  };

  return (
    <div className="app-shell">
      <Sidebar role={user.role} />
      <div className="main-area">
        <Navbar title="Student Profile" />
        <main className="page">
          {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
          {!profile ? (
            <p>Loading profile...</p>
          ) : (
            <>
              {assetError ? <p style={{ color: '#b91c1c' }}>{assetError}</p> : null}
              {assetMessage ? <p style={{ color: '#166534' }}>{assetMessage}</p> : null}

              <div className="card" style={{ marginBottom: '1rem' }}>
                <h3 style={{ marginTop: 0 }}>Student Digital Assets</h3>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button type="button" onClick={handleDownloadCard} disabled={isDownloadingCard}>
                    {isDownloadingCard ? 'Downloading Card...' : 'Download Card (PDF)'}
                  </button>
                  <button type="button" className="secondary" onClick={handleViewQr} disabled={isLoadingQr}>
                    {isLoadingQr ? 'Loading QR...' : 'View QR Code'}
                  </button>
                </div>

                {qrPreviewUrl ? (
                  <div style={{ marginTop: '0.9rem' }}>
                    <img
                      src={qrPreviewUrl}
                      alt={`QR code for ${resolvedUID}`}
                      style={{ width: '220px', maxWidth: '100%', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}
                    />
                    <p style={{ marginBottom: 0, color: '#475569' }}>Scan QR to verify this student publicly.</p>
                  </div>
                ) : null}
              </div>

              <div className="grid">
                <StudentCard profile={profile} spi={spi} />
                <SPIGraph spi={spi} />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default StudentProfile;
