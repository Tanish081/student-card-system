import { useEffect, useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import api from '../services/api';

const StudentIDCard = ({ profile, spi }) => {
  const cardRef = useRef(null);
  const [qrUrl, setQrUrl] = useState('');
  const [assetMessage, setAssetMessage] = useState('');
  const [assetError, setAssetError] = useState('');
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [digilockerPreview, setDigilockerPreview] = useState(null);

  const verifyLink = useMemo(() => {
    const appUrl = (import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin).replace(/\/$/, '');
    return profile?.uid ? `${appUrl}/verify/${profile.uid}` : '';
  }, [profile?.uid]);

  useEffect(
    () => () => {
      if (qrUrl) URL.revokeObjectURL(qrUrl);
    },
    [qrUrl]
  );

  useEffect(() => {
    const loadQr = async () => {
      if (!profile?.uid) return;

      setLoadingAssets(true);
      setAssetError('');
      try {
        const response = await api.get(`/student/${profile.uid}/qrcode`, {
          responseType: 'blob'
        });

        const url = URL.createObjectURL(response.data);
        setQrUrl((previous) => {
          if (previous) URL.revokeObjectURL(previous);
          return url;
        });
      } catch (apiError) {
        setAssetError(apiError?.response?.data?.message || 'Failed to load verification QR code');
      } finally {
        setLoadingAssets(false);
      }
    };

    loadQr();
  }, [profile?.uid]);

  const downloadPNG = async () => {
    if (!cardRef.current || !profile?.uid) return;

    setAssetError('');
    setAssetMessage('');
    const canvas = await html2canvas(cardRef.current, {
      backgroundColor: '#f8fafc',
      scale: 2,
      useCORS: true
    });

    canvas.toBlob((blob) => {
      if (!blob) return;
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${profile.uid}-civic-card.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setAssetMessage('PNG card downloaded successfully.');
    }, 'image/png');
  };

  const downloadPDF = async () => {
    if (!cardRef.current || !profile?.uid) return;

    setAssetError('');
    setAssetMessage('');
    const canvas = await html2canvas(cardRef.current, {
      backgroundColor: '#f8fafc',
      scale: 2,
      useCORS: true
    });

    const image = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 10;
    const width = pageWidth - margin * 2;
    const height = (canvas.height * width) / canvas.width;

    pdf.addImage(image, 'PNG', margin, 12, width, height, undefined, 'FAST');
    pdf.save(`${profile.uid}-civic-card.pdf`);
    setAssetMessage('PDF card downloaded successfully.');
  };

  const handleShareLink = async () => {
    if (!verifyLink) return;

    setAssetError('');
    setAssetMessage('');

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${profile.name} - Student Verification`,
          text: 'Verify student civic identity',
          url: verifyLink
        });
        setAssetMessage('Verification link shared.');
        return;
      }

      await navigator.clipboard.writeText(verifyLink);
      setAssetMessage('Verification link copied to clipboard.');
    } catch (_error) {
      setAssetError('Failed to share verification link.');
    }
  };

  const loadDigiLockerStub = async () => {
    if (!profile?.uid) return;

    setAssetError('');
    setAssetMessage('');
    try {
      const response = await api.get(`/student/${profile.uid}/digilocker-export`);
      setDigilockerPreview(response.data.data);
      setAssetMessage('DigiLocker stub payload loaded.');
    } catch (apiError) {
      setAssetError(apiError?.response?.data?.message || 'Failed to load DigiLocker export stub');
    }
  };

  if (!profile) return null;

  return (
    <section className="card" style={{ marginTop: '1rem' }}>
      <h3 style={{ marginTop: 0 }}>Digital Bharat Civic Identity Card</h3>

      {assetError ? <p style={{ color: '#b91c1c' }}>{assetError}</p> : null}
      {assetMessage ? <p style={{ color: '#166534' }}>{assetMessage}</p> : null}

      <div ref={cardRef} className="civic-id-card">
        <div className="civic-id-header">
          <p style={{ margin: 0, fontWeight: 700 }}>Government School Civic Trust Network</p>
          <small>Student Civic Identity</small>
        </div>
        <div className="civic-id-grid">
          <div>
            <p style={{ margin: '0 0 0.3rem' }}><strong>Name:</strong> {profile.name}</p>
            <p style={{ margin: '0 0 0.3rem' }}><strong>UID:</strong> {profile.uid}</p>
            <p style={{ margin: '0 0 0.3rem' }}><strong>Class:</strong> {profile.class}{profile.section}</p>
            <p style={{ margin: '0 0 0.3rem' }}><strong>SPI:</strong> {spi?.spi ?? 0} ({spi?.category || 'N/A'})</p>
            <p style={{ margin: 0 }}><strong>SPI Total:</strong> {spi?.spiTotal ?? 0} / 1000</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            {loadingAssets ? <p style={{ margin: 0 }}>Loading QR...</p> : null}
            {qrUrl ? <img src={qrUrl} alt="Verification QR" className="civic-id-qr" /> : null}
            <small style={{ color: '#475569' }}>Scan to verify</small>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
        <button type="button" onClick={downloadPNG}>Download PNG</button>
        <button type="button" className="secondary" onClick={downloadPDF}>Download PDF</button>
        <button type="button" className="secondary" onClick={handleShareLink}>Share Verification Link</button>
        <button type="button" className="secondary" onClick={loadDigiLockerStub}>DigiLocker Export (Stub)</button>
      </div>

      {digilockerPreview ? (
        <pre style={{ marginTop: '0.7rem', maxHeight: '220px', overflow: 'auto', background: '#0f172a', color: '#e2e8f0', padding: '0.75rem', borderRadius: '0.5rem' }}>
          {JSON.stringify(digilockerPreview, null, 2)}
        </pre>
      ) : null}
    </section>
  );
};

export default StudentIDCard;
