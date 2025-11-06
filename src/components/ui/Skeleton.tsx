'use client';

type SkeletonProps = {
  className?: string;
  width?: string;
  height?: string;
  rounded?: boolean;
};

export default function Skeleton({ className = '', width = '100%', height = '1rem', rounded = true }: SkeletonProps) {
  return (
    <div
      className={`bg-gray-200 animate-pulse ${rounded ? 'rounded' : ''} ${className}`}
      style={{ width, height }}
    />
  );
}

