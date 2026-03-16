import { useMemo, useState } from 'react';

const PrincipalAgenda = ({ initialItems = [] }) => {
  const [items, setItems] = useState(initialItems);

  const rankText = useMemo(() => 'Your school ranks #3 of 48 on platform SPI average.', []);

  const toggleItem = (id) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item)));
  };

  return (
    <section className="principal-agenda-panel">
      <header>
        <h3>Today's Actions</h3>
      </header>

      <div className="principal-agenda-list">
        {items.map((item) => (
          <button type="button" key={item.id} className={`principal-agenda-item ${item.done ? 'is-done' : ''}`} onClick={() => toggleItem(item.id)}>
            <span>{item.done ? 'x' : ' '}</span>
            <p>{item.text}</p>
          </button>
        ))}
      </div>

      <blockquote>{rankText}</blockquote>
    </section>
  );
};

export default PrincipalAgenda;
