import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import ProgressBar from '@/components/ProgressBar';
import Timeline from '@/components/Timeline';
import { mockProjects } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, Unlock, TrendingUp, DollarSign, Coins } from 'lucide-react';
import { InvestModal } from '@/components/InvestModal';
import { useXrpl } from '@/contexts/XrplContext';

const InvestButton = ({ projectId }: { projectId: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isConnected } = useXrpl();
  
  // Platform wallet address (should come from backend or env)
  const platformWallet = 'rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDY';

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        disabled={!isConnected}
      >
        {isConnected ? 'Invest Now' : 'Connect Wallet First'}
      </Button>
      <InvestModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        campaignId={projectId}
        platformWallet={platformWallet}
        minAmount={1}
        maxAmount={10000}
      />
    </>
  );
};

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const project = mockProjects.find(p => p.id === id);

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Project not found</h1>
          <Button onClick={() => navigate('/projects')}>Back to Projects</Button>
        </div>
      </div>
    );
  }

  const metrics = [
    { label: 'Pre-Money Valuation', value: `$${(project.preMoney / 1000000).toFixed(1)}M`, icon: TrendingUp },
    { label: 'Post-Money Valuation', value: `$${(project.postMoney / 1000000).toFixed(1)}M`, icon: DollarSign },
    { label: 'Token Price', value: `$${project.tokenPrice}`, icon: Coins },
  ];

  return (
    <div className="min-h-screen bg-background">
      
      <div className="container mx-auto px-4 py-12">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate('/projects')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-card border-border">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-5xl mb-4">{project.logo}</div>
                      <CardTitle className="text-3xl mb-2">{project.name}</CardTitle>
                      <p className="text-xl text-primary font-semibold">{project.symbol}</p>
                    </div>
                    <Badge className={project.escrowStatus === 'locked' ? 'bg-warning' : 'bg-success'}>
                      {project.escrowStatus === 'locked' ? (
                        <><Lock className="mr-1 h-3 w-3" /> Escrowed</>
                      ) : (
                        <><Unlock className="mr-1 h-3 w-3" /> Released</>
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-6">{project.description}</p>
                  <ProgressBar current={project.raised} goal={project.goal} />
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Valuation Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {metrics.map((metric, index) => (
                      <div key={index} className="bg-secondary/50 rounded-xl p-4">
                        <metric.icon className="h-8 w-8 text-primary mb-2" />
                        <p className="text-sm text-muted-foreground mb-1">{metric.label}</p>
                        <p className="text-2xl font-bold">{metric.value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Tokenomics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Supply</p>
                      <p className="text-xl font-bold">{project.totalSupply.toLocaleString()} tokens</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Offered for Sale</p>
                      <p className="text-xl font-bold">{project.offeredPercentage}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Tokens Offered</p>
                      <p className="text-xl font-bold">
                        {((project.totalSupply * project.offeredPercentage) / 100).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Target Amount</p>
                      <p className="text-xl font-bold">${project.goal.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Investment Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <Timeline events={project.timeline} />
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-gradient-card border-primary/50">
                <CardContent className="pt-6">
                  <h3 className="text-xl font-bold mb-4">Ready to Invest?</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Connect your XRPL wallet to participate in this fundraise.
                  </p>
                  <InvestButton projectId={project.id} />
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
