import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Shield, Lock, Coins, Users, ArrowRight, CheckCircle } from 'lucide-react';

const About = () => {
  const features = [
    {
      icon: Lock,
      title: 'XRPL Escrow Security',
      description: 'All fundraising capital is locked in XRPL escrow smart contracts until predefined milestones are achieved, protecting investor funds.',
    },
    {
      icon: Coins,
      title: 'Tokenized Ownership',
      description: 'Each investment is represented by tokens issued on the XRP Ledger, providing transparent proof of ownership and easy transferability.',
    },
    {
      icon: Users,
      title: 'Automated Dividends',
      description: 'Profit distributions are executed via batch transactions on XRPL, ensuring timely and transparent dividend payments to all token holders.',
    },
    {
      icon: Shield,
      title: 'Regulatory Compliant',
      description: 'Built with compliance in mind, supporting KYC/AML processes while maintaining the benefits of decentralized technology.',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Project Submission',
      description: 'Startups submit their fundraising proposal with detailed tokenomics and milestones.',
    },
    {
      number: '02',
      title: 'Escrow Creation',
      description: 'Approved projects have their funds locked in XRPL escrow for security and transparency.',
    },
    {
      number: '03',
      title: 'Token Issuance',
      description: 'Investment tokens are issued to backers, representing their ownership percentage.',
    },
    {
      number: '04',
      title: 'Milestone Tracking',
      description: 'As startups hit milestones, escrow funds are released according to the agreement.',
    },
    {
      number: '05',
      title: 'Dividend Distribution',
      description: 'Profits are distributed to token holders through automated XRPL batch payments.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            About <span className="text-gradient">XRise</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            XRise is revolutionizing startup fundraising by leveraging the power of the XRP Ledger 
            to create a secure, transparent, and efficient platform for both entrepreneurs and investors.
          </p>
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Start Investing
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-20"
        >
          <h2 className="text-3xl font-bold text-center mb-12">
            Key <span className="text-gradient">Features</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <Card className="h-full bg-card border-border hover:border-primary/50 transition-all duration-300">
                  <CardContent className="pt-6">
                    <feature.icon className="h-12 w-12 text-primary mb-4" />
                    <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mb-20"
        >
          <h2 className="text-3xl font-bold text-center mb-12">
            How It <span className="text-gradient">Works</span>
          </h2>
          <div className="max-w-3xl mx-auto space-y-6">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
              >
                <Card className="bg-card border-border">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-6">
                      <div className="text-4xl font-bold text-primary/30">
                        {step.number}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-5 w-5 text-success" />
                          <h3 className="text-xl font-bold">{step.title}</h3>
                        </div>
                        <p className="text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
          className="text-center"
        >
          <Card className="bg-gradient-card border-primary/50 max-w-2xl mx-auto">
            <CardContent className="pt-8 pb-8">
              <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-muted-foreground mb-6">
                Join thousands of investors supporting innovative startups on the XRP Ledger.
              </p>
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Explore Projects
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default About;
