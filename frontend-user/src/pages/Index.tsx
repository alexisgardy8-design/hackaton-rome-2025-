import Hero from '@/components/Hero';
import { motion } from 'framer-motion';
import { Shield, Zap, Users } from 'lucide-react';

const Index = () => {
  const features = [
    {
      icon: Shield,
      title: 'Secure Escrow',
      description: 'Funds locked in XRPL escrow until milestones are met, ensuring investor protection.',
    },
    {
      icon: Zap,
      title: 'Instant Settlement',
      description: 'Fast and efficient transactions powered by the XRP Ledger infrastructure.',
    },
    {
      icon: Users,
      title: 'Community Driven',
      description: 'Token holders participate in governance and receive regular dividend distributions.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Hero />
      
      <section className="py-20 bg-card/50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose <span className="text-gradient">XRise</span>?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Built on cutting-edge blockchain technology to provide transparency, 
              security, and efficiency for both startups and investors.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="bg-card border border-border rounded-2xl p-8 hover:border-primary/50 transition-all duration-300"
              >
                <feature.icon className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
