import { SkeletonRow } from './Skeleton';

const SectionLoader = ({ rows = 5 }) => {
  return (
    <div className="section-loader" aria-live="polite" aria-busy="true">
      {Array.from({ length: rows }).map((_, index) => (
        <SkeletonRow key={index} />
      ))}
    </div>
  );
};

export default SectionLoader;
