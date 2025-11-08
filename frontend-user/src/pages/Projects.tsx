import ProjectCard from '@/components/ProjectCard';
import { mockProjects } from '@/data/mockData';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Projects = () => {
  const activeProjects = mockProjects.filter(p => p.status === 'active');
  const fundedProjects = mockProjects.filter(p => p.status === 'funded' || p.status === 'completed');

  return (
    <div className="min-h-screen bg-background">
      
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Investment <span className="text-gradient">Opportunities</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Discover innovative startups raising capital on the XRP Ledger. 
            Each project is secured with escrow and tokenized for transparency.
          </p>
        </motion.div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="all">All Projects</TabsTrigger>
            <TabsTrigger value="active">Active ({activeProjects.length})</TabsTrigger>
            <TabsTrigger value="funded">Funded ({fundedProjects.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockProjects.map((project, index) => (
                <ProjectCard key={project.id} project={project} index={index} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="active">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeProjects.map((project, index) => (
                <ProjectCard key={project.id} project={project} index={index} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="funded">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {fundedProjects.map((project, index) => (
                <ProjectCard key={project.id} project={project} index={index} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Projects;
