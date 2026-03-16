import { useEffect, useState } from 'react';
import api from '../services/api';

const STATUS_OPTIONS = ['applied', 'shortlisted', 'selected', 'rejected'];

const OpportunityApplicationsReview = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState('');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [bulkStatus, setBulkStatus] = useState('shortlisted');
  const [selectedApplicationIds, setSelectedApplicationIds] = useState([]);

  const loadOpportunities = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/opportunities', {
        params: { page: 1, limit: 20 }
      });
      const list = response.data.data.opportunities || [];
      setOpportunities(list);
      if (!selectedOpportunityId && list.length) {
        setSelectedOpportunityId(String(list[0].id));
      }
    } catch (apiError) {
      setError(apiError?.response?.data?.message || 'Failed to load opportunities for review');
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = async (opportunityId) => {
    if (!opportunityId) {
      setApplications([]);
      return;
    }

    setApplicationsLoading(true);
    setError('');

    try {
      const response = await api.get(`/opportunities/${opportunityId}/applications`, {
        params: { page: 1, limit: 50 }
      });
      setApplications(response.data.data.applications || []);
      setSelectedApplicationIds([]);
    } catch (apiError) {
      setError(apiError?.response?.data?.message || 'Failed to load applications');
    } finally {
      setApplicationsLoading(false);
    }
  };

  useEffect(() => {
    loadOpportunities();
  }, []);

  useEffect(() => {
    loadApplications(selectedOpportunityId);
  }, [selectedOpportunityId]);

  const updateOne = async (applicationId, status) => {
    if (!selectedOpportunityId) return;

    setMessage('');
    setError('');
    try {
      await api.patch(`/opportunities/${selectedOpportunityId}/applications/${applicationId}/status`, {
        status
      });
      setMessage(`Application moved to ${status}.`);
      await loadApplications(selectedOpportunityId);
      await loadOpportunities();
    } catch (apiError) {
      setError(apiError?.response?.data?.message || 'Failed to update application status');
    }
  };

  const toggleApplicationSelection = (id) => {
    setSelectedApplicationIds((previous) => {
      if (previous.includes(id)) return previous.filter((item) => item !== id);
      return [...previous, id];
    });
  };

  const updateBulk = async () => {
    if (!selectedOpportunityId || !selectedApplicationIds.length) return;

    setMessage('');
    setError('');
    try {
      await api.patch(`/opportunities/${selectedOpportunityId}/applications/status/bulk`, {
        status: bulkStatus,
        applicationIds: selectedApplicationIds
      });
      setMessage(`${selectedApplicationIds.length} application(s) moved to ${bulkStatus}.`);
      await loadApplications(selectedOpportunityId);
      await loadOpportunities();
    } catch (apiError) {
      setError(apiError?.response?.data?.message || 'Failed to bulk update application statuses');
    }
  };

  const selectedOpportunity = opportunities.find((item) => String(item.id) === String(selectedOpportunityId));

  return (
    <section className="card" style={{ marginTop: '1rem' }}>
      <h3 style={{ marginTop: 0 }}>Opportunity Application Review</h3>
      {message ? <p style={{ color: '#166534' }}>{message}</p> : null}
      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}

      {loading ? <p>Loading opportunities...</p> : null}

      {!loading ? (
        <>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.7rem' }}>
            <select
              value={selectedOpportunityId}
              onChange={(event) => setSelectedOpportunityId(event.target.value)}
              style={{ minWidth: '260px' }}
            >
              {!opportunities.length ? <option value="">No opportunities found</option> : null}
              {opportunities.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
            <button type="button" className="secondary" onClick={loadOpportunities}>Refresh</button>
          </div>

          {selectedOpportunity ? (
            <div className="card" style={{ borderColor: '#dbeafe', marginBottom: '0.7rem' }}>
              <p style={{ margin: 0 }}>
                <strong>Status Summary:</strong> Applied {selectedOpportunity.applicationSummary?.applied || 0}, Shortlisted {selectedOpportunity.applicationSummary?.shortlisted || 0}, Selected {selectedOpportunity.applicationSummary?.selected || 0}, Rejected {selectedOpportunity.applicationSummary?.rejected || 0}
              </p>
            </div>
          ) : null}

          <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
            <select value={bulkStatus} onChange={(event) => setBulkStatus(event.target.value)}>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <button type="button" onClick={updateBulk} disabled={!selectedApplicationIds.length}>
              Bulk Update ({selectedApplicationIds.length})
            </button>
          </div>

          {applicationsLoading ? <p>Loading applications...</p> : null}

          {!applicationsLoading ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Student UID</th>
                    <th>Status</th>
                    <th>Relevance</th>
                    <th>Success %</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.length ? (
                    applications.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedApplicationIds.includes(item.id)}
                            onChange={() => toggleApplicationSelection(item.id)}
                          />
                        </td>
                        <td>{item.studentUID}</td>
                        <td>{item.status}</td>
                        <td>{item.relevanceScoreSnapshot}</td>
                        <td>{item.successProbabilitySnapshot}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                            {STATUS_OPTIONS.map((status) => (
                              <button
                                key={status}
                                type="button"
                                className="secondary"
                                onClick={() => updateOne(item.id, status)}
                                disabled={item.status === status}
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6}>No applications available for this opportunity.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
};

export default OpportunityApplicationsReview;
