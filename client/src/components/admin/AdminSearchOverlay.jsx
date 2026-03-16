import { useEffect, useMemo, useRef } from 'react';

const AdminSearchOverlay = ({ open, query, onChange, onClose, data = {} }) => {
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    inputRef.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const results = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) {
      return { students: [], schools: [], achievements: [] };
    }

    const students = (data.students || []).filter((item) =>
      [item.name, item.uid, item.className].join(' ').toLowerCase().includes(text)
    ).slice(0, 8);

    const schools = (data.schools || []).filter((item) =>
      [item.name, item.district].join(' ').toLowerCase().includes(text)
    ).slice(0, 6);

    const achievements = (data.achievements || []).filter((item) =>
      [item.title, item.student].join(' ').toLowerCase().includes(text)
    ).slice(0, 6);

    return { students, schools, achievements };
  }, [data.achievements, data.schools, data.students, query]);

  if (!open) {
    return null;
  }

  return (
    <div className="admin-search-overlay" role="dialog" aria-modal="true">
      <button type="button" className="admin-search-backdrop" onClick={onClose} aria-label="Close search" />
      <div className="admin-search-content">
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search students, schools, achievements"
        />

        <div className="admin-search-results">
          <section>
            <h4>Students</h4>
            {results.students.length ? results.students.map((item) => <p key={item.uid}>{item.name} · {item.uid}</p>) : <small>No student matches</small>}
          </section>
          <section>
            <h4>Schools</h4>
            {results.schools.length ? results.schools.map((item) => <p key={item.name}>{item.name} · {item.district}</p>) : <small>No school matches</small>}
          </section>
          <section>
            <h4>Achievements</h4>
            {results.achievements.length ? results.achievements.map((item) => <p key={item.id}>{item.title} · {item.student}</p>) : <small>No achievement matches</small>}
          </section>
        </div>
      </div>
    </div>
  );
};

export default AdminSearchOverlay;
