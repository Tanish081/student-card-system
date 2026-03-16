import { useState } from 'react';

const PrincipalVerificationCard = ({ item, onVerify, onReject }) => {
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState('');

  return (
    <article className="principal-verification-card">
      <div className="principal-verification-head">
        <div className="principal-avatar-circle">{item.initials}</div>
        <div>
          <strong>{item.name} · {item.className}</strong>
          <p>{item.title}</p>
          <small>Submitted {item.submittedAgo}</small>
        </div>
      </div>

      {!showReject ? (
        <div className="principal-verification-actions">
          <button type="button" className="verify" onClick={() => onVerify(item)}>Verify</button>
          <button type="button" className="reject" onClick={() => setShowReject(true)}>Reject</button>
        </div>
      ) : (
        <div className="principal-reject-inline">
          <textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason for rejection" />
          <div>
            <button type="button" className="verify" onClick={() => onReject(item, reason)}>Submit</button>
            <button type="button" className="reject" onClick={() => setShowReject(false)}>Cancel</button>
          </div>
        </div>
      )}
    </article>
  );
};

export default PrincipalVerificationCard;
