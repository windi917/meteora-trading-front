// components/RangeSlider.tsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import styles from './RangeSlider.module.css';

interface RangeSliderProps {
  min: number;
  max: number;
  minValue: number;
  maxValue: number;
  onMinValueChange: (value: number) => void;
  onMaxValueChange: (value: number) => void;
}

const RangeSlider: React.FC<RangeSliderProps> = ({
  min,
  max,
  minValue,
  maxValue,
  onMinValueChange,
  onMaxValueChange
}) => {
  const [dragging, setDragging] = useState<'min' | 'max' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (handle: 'min' | 'max') => () => setDragging(handle);
  const handleMouseUp = () => setDragging(null);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (dragging && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      const value = Math.floor(min + (max - min) * (percentage / 100));

      if (dragging === 'min') {
        onMinValueChange(Math.min(value, maxValue - 1)); // Ensure min is less than max
      } else if (dragging === 'max') {
        onMaxValueChange(Math.max(value, minValue + 1)); // Ensure max is greater than min
      }
    }
  }, [dragging, min, max, minValue, maxValue, onMinValueChange, onMaxValueChange]);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove]);

  const handleClick = (event: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      const value = Math.floor(min + (max - min) * (percentage / 100));

      if (Math.abs(value - minValue) < Math.abs(value - maxValue)) {
        onMinValueChange(Math.min(value, maxValue - 1));
      } else {
        onMaxValueChange(Math.max(value, minValue + 1));
      }
    }
  };

  const minHandlePosition = ((minValue - min) / (max - min)) * 100;
  const maxHandlePosition = ((maxValue - min) / (max - min)) * 100;

  return (
    <div
      className={styles.container}
      ref={containerRef}
      onClick={handleClick}
    >
      <div
        className={styles.track}
        style={{ left: `${minHandlePosition}%`, width: `${maxHandlePosition - minHandlePosition}%` }}
      />
      <div
        className={styles.handle}
        style={{ left: `${minHandlePosition}%` }}
        onMouseDown={handleMouseDown('min')}
      />
      <div
        className={styles.handle}
        style={{ left: `${maxHandlePosition}%` }}
        onMouseDown={handleMouseDown('max')}
      />
    </div>
  );
};

export default RangeSlider;
