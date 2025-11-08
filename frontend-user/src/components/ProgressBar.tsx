import { motion } from 'framer-motion';

interface ProgressBarProps {
  current: number;
  goal: number;
  className?: string;
}

const ProgressBar = ({ current, goal, className = '' }: ProgressBarProps) => {
  const percentage = Math.min((current / goal) * 100, 100);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Progress</span>
        <span className="font-semibold text-primary">{percentage.toFixed(1)}%</span>
      </div>
      <div className="h-3 bg-secondary rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>${(current / 1000).toFixed(0)}K raised</span>
        <span>${(goal / 1000).toFixed(0)}K goal</span>
      </div>
    </div>
  );
};

export default ProgressBar;
