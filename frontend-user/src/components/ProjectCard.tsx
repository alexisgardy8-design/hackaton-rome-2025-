import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ProgressBar from './ProgressBar';
import { Project } from '@/data/mockData';

interface ProjectCardProps {
  project: Project;
  index: number;
}

const ProjectCard = ({ project, index }: ProjectCardProps) => {
  const navigate = useNavigate();
  const daysRemaining = Math.ceil(
    (new Date(project.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  const statusColors = {
    active: 'bg-success',
    funded: 'bg-primary',
    completed: 'bg-silver',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -8 }}
      className="h-full"
    >
      <Card className="h-full flex flex-col bg-card border-border hover:border-primary/50 transition-all duration-300">
        <CardHeader>
          <div className="flex items-start justify-between mb-4">
            <div className="text-4xl">{project.logo}</div>
            <Badge className={statusColors[project.status]}>
              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
            </Badge>
          </div>
          <h3 className="text-xl font-bold mb-2">{project.name}</h3>
          <p className="text-sm text-primary font-semibold mb-2">{project.symbol}</p>
          <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
        </CardHeader>

        <CardContent className="flex-1">
          <ProgressBar current={project.raised} goal={project.goal} />
          
          <div className="mt-4 space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="mr-2 h-4 w-4" />
              {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Completed'}
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <TrendingUp className="mr-2 h-4 w-4" />
              {project.category}
            </div>
          </div>
        </CardContent>

        <CardFooter>
          <Button
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => navigate(`/projects/${project.id}`)}
          >
            View Details
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default ProjectCard;
