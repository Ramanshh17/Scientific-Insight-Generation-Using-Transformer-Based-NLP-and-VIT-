import { cn } from '../utils/cn';

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  color?: string;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value, max = 100, label, color = 'bg-indigo-500', showValue = true, size = 'md'
}) => {
  const percentage = Math.min(100, (value / max) * 100);
  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' };

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between mb-1">
          {label && <span className="text-xs text-slate-400">{label}</span>}
          {showValue && <span className="text-xs text-slate-300 font-medium">{Math.round(value)}/{max}</span>}
        </div>
      )}
      <div className={cn('w-full rounded-full bg-slate-700/50 overflow-hidden', heights[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-1000 ease-out', color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
