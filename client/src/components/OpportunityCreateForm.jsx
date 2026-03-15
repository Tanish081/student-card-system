import { useMemo, useState } from 'react';
import api from '../services/api';

const EVENT_TYPES = ['competition', 'workshop', 'sports', 'scholarship', 'training'];
const CATEGORIES = ['science', 'technology', 'sports', 'arts', 'mathematics', 'debate', 'robotics', 'music'];

const ALLOWED_FILE_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]);
const MAX_FILE_SIZE_KB = 4096;

const initialForm = {
  title: '',
  description: '',
  eventType: 'competition',
  category: 'science',
  skillTagsInput: '',
  eligibleClassesInput: '',
  minSPI: 0,
  deadline: ''
};

const splitInput = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });

const OpportunityCreateForm = ({ heading = 'Post Opportunity', allowScholarship = true }) => {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileInputKey, setFileInputKey] = useState(0);

  const eventTypeOptions = useMemo(() => {
    if (allowScholarship) return EVENT_TYPES;
    return EVENT_TYPES.filter((item) => item !== 'scholarship');
  }, [allowScholarship]);

  const submitOpportunity = async (event) => {
    event.preventDefault();
    setNotice('');
    setError('');
    setLoading(true);

    try {
      const attachments = await Promise.all(
        selectedFiles.map(async (file) => {
          if (!ALLOWED_FILE_TYPES.has(file.type)) {
            throw new Error(`Unsupported file type for ${file.name}`);
          }

          const sizeKB = Math.round(file.size / 1024);
          if (sizeKB > MAX_FILE_SIZE_KB) {
            throw new Error(`${file.name} exceeds ${MAX_FILE_SIZE_KB} KB`);
          }

          return {
            fileName: file.name,
            mimeType: file.type,
            dataUrl: await fileToDataUrl(file),
            sizeKB
          };
        })
      );

      await api.post('/opportunities', {
        title: form.title,
        description: form.description,
        eventType: form.eventType,
        category: form.category,
        skillTags: splitInput(form.skillTagsInput),
        eligibleClasses: splitInput(form.eligibleClassesInput).map((item) => item.toUpperCase()),
        minSPI: Number(form.minSPI || 0),
        deadline: form.deadline,
        attachments
      });

      setForm(initialForm);
      setSelectedFiles([]);
      setFileInputKey((prev) => prev + 1);
      setNotice('Opportunity posted successfully.');
    } catch (apiError) {
      setError(apiError?.response?.data?.message || 'Failed to post opportunity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card">
      <h3 style={{ marginTop: 0 }}>{heading}</h3>

      {notice ? <p style={{ color: '#166534' }}>{notice}</p> : null}
      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}

      <form onSubmit={submitOpportunity}>
        <div className="form-grid">
          <div style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="opportunity-title">Title</label>
            <input
              id="opportunity-title"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="National Robotics Challenge"
              required
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="opportunity-description">Description</label>
            <textarea
              id="opportunity-description"
              rows={3}
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Share event details, requirements, and how students should prepare"
              required
            />
          </div>

          <div>
            <label htmlFor="opportunity-event-type">Event Type</label>
            <select
              id="opportunity-event-type"
              value={form.eventType}
              onChange={(event) => setForm((prev) => ({ ...prev, eventType: event.target.value }))}
            >
              {eventTypeOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="opportunity-category">Category</label>
            <select
              id="opportunity-category"
              value={form.category}
              onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
            >
              {CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="opportunity-skills">Skill Tags (comma separated)</label>
            <input
              id="opportunity-skills"
              value={form.skillTagsInput}
              onChange={(event) => setForm((prev) => ({ ...prev, skillTagsInput: event.target.value }))}
              placeholder="logic, coding, problem-solving"
            />
          </div>

          <div>
            <label htmlFor="opportunity-classes">Eligible Classes (comma separated)</label>
            <input
              id="opportunity-classes"
              value={form.eligibleClassesInput}
              onChange={(event) => setForm((prev) => ({ ...prev, eligibleClassesInput: event.target.value }))}
              placeholder="8A, 8B, 9A"
              required
            />
          </div>

          <div>
            <label htmlFor="opportunity-min-spi">Minimum SPI</label>
            <input
              id="opportunity-min-spi"
              type="number"
              min="0"
              max="100"
              value={form.minSPI}
              onChange={(event) => setForm((prev) => ({ ...prev, minSPI: event.target.value }))}
            />
          </div>

          <div>
            <label htmlFor="opportunity-deadline">Deadline</label>
            <input
              id="opportunity-deadline"
              type="datetime-local"
              value={form.deadline}
              onChange={(event) => setForm((prev) => ({ ...prev, deadline: event.target.value }))}
              required
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="opportunity-attachments">Attachments (PDF, JPG, PNG, WEBP, DOC, DOCX)</label>
            <input
              key={fileInputKey}
              id="opportunity-attachments"
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
              onChange={(event) => setSelectedFiles(Array.from(event.target.files || []))}
            />
            {selectedFiles.length ? (
              <p style={{ margin: '0.4rem 0 0', color: '#475569', fontSize: '0.85rem' }}>
                {selectedFiles.length} file(s): {selectedFiles.map((file) => file.name).join(', ')}
              </p>
            ) : null}
          </div>
        </div>

        <button type="submit" style={{ marginTop: '0.75rem' }} disabled={loading}>
          {loading ? 'Posting...' : 'Post Opportunity'}
        </button>
      </form>
    </section>
  );
};

export default OpportunityCreateForm;
