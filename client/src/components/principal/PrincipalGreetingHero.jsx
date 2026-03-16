import { useEffect, useMemo, useRef, useState } from 'react';

const getGreeting = (hours) => {
  if (hours < 12) return 'Good morning';
  if (hours < 17) return 'Good afternoon';
  return 'Good evening';
};

const PrincipalGreetingHero = ({ userName, schoolName, onVerify, onPostOpportunity, onDownload }) => {
  const [typedName, setTypedName] = useState('');
  const timerRef = useRef(0);

  const greeting = useMemo(() => getGreeting(new Date().getHours()), []);
  const today = useMemo(() => new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  }), []);

  useEffect(() => {
    const text = userName || 'Principal';
    let index = 0;
    setTypedName('');

    timerRef.current = window.setInterval(() => {
      setTypedName(text.slice(0, index + 1));
      index += 1;
      if (index >= text.length) {
        window.clearInterval(timerRef.current);
      }
    }, 40);

    return () => window.clearInterval(timerRef.current);
  }, [userName]);

  return (
    <section className="principal-greeting-hero">
      <div>
        <h1>{greeting}, <span>{typedName}</span></h1>
        <p>{schoolName} · Academic Year 2025-26</p>
        <small>{today}</small>
      </div>

      <div className="principal-hero-actions">
        <button type="button" onClick={onVerify}>+ Verify Achievement</button>
        <button type="button" onClick={onPostOpportunity}>+ Post Opportunity</button>
        <button type="button" onClick={onDownload}>Download Report</button>
      </div>
    </section>
  );
};

export default PrincipalGreetingHero;
