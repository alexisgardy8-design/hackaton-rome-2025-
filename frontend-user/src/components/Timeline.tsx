import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface TimelineEvent {
  date: string;
  event: string;
  status: 'completed' | 'current' | 'upcoming';
}

interface TimelineProps {
  events: TimelineEvent[];
}

const Timeline = ({ events }: TimelineProps) => {
  const getIcon = (status: TimelineEvent['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-6 w-6 text-success" />;
      case 'current':
        return <Clock className="h-6 w-6 text-primary" />;
      case 'upcoming':
        return <Circle className="h-6 w-6 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-4">
      {events.map((event, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="flex gap-4"
        >
          <div className="flex flex-col items-center">
            <div className="flex-shrink-0">{getIcon(event.status)}</div>
            {index < events.length - 1 && (
              <div className="w-0.5 h-full bg-border mt-2" />
            )}
          </div>
          <div className="pb-8">
            <p className="text-sm text-muted-foreground mb-1">{event.date}</p>
            <p className="font-semibold">{event.event}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default Timeline;
