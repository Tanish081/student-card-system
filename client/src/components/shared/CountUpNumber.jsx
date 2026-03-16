import useCountUp from '../../hooks/useCountUp';

const CountUpNumber = ({
  value = 0,
  delay = 0,
  duration = 1800,
  locale = 'en-IN',
  suffix = '',
  className = ''
}) => {
  const count = useCountUp(Number(value) || 0, { duration, delay });

  return (
    <span className={className}>
      {count.toLocaleString(locale)}
      {suffix}
    </span>
  );
};

export default CountUpNumber;
