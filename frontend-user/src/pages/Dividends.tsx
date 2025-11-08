import { mockDividends, mockInvestments } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Wallet } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dividends = () => {
  const totalDividends = mockDividends.reduce((sum, div) => sum + div.amount, 0);
  const activeInvestments = mockInvestments.length;
  const pendingPayouts = mockDividends.filter(
    d => new Date(d.date) > new Date()
  ).reduce((sum, div) => sum + div.amount, 0);

  const stats = [
    { 
      label: 'Total Dividends Received', 
      value: `$${totalDividends.toLocaleString()}`, 
      icon: DollarSign,
      color: 'text-success' 
    },
    { 
      label: 'Active Investments', 
      value: activeInvestments.toString(), 
      icon: Wallet,
      color: 'text-primary' 
    },
    { 
      label: 'Pending Payouts', 
      value: `$${pendingPayouts.toLocaleString()}`, 
      icon: TrendingUp,
      color: 'text-warning' 
    },
  ];

  // Prepare chart data
  const chartData = mockDividends
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .reduce((acc: any[], dividend) => {
      const existingEntry = acc.find(entry => entry.date === dividend.date);
      if (existingEntry) {
        existingEntry.amount += dividend.amount;
      } else {
        acc.push({ date: dividend.date, amount: dividend.amount });
      }
      return acc;
    }, [])
    .map((entry, index, arr) => ({
      ...entry,
      cumulative: arr.slice(0, index + 1).reduce((sum, e) => sum + e.amount, 0),
    }));

  return (
    <div className="min-h-screen bg-background">
      
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Dividend <span className="text-gradient">Analytics</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Track your earnings from tokenized investments across the XRise platform.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-card border-border">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                  <p className="text-2xl font-bold mb-1">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Cumulative Dividend History</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="cumulative" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#colorCumulative)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Recent Dividend Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockDividends.slice(0, 6).map((dividend, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                    className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl"
                  >
                    <div>
                      <p className="font-semibold">{dividend.projectName}</p>
                      <p className="text-sm text-muted-foreground">{dividend.symbol} • {dividend.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-success">+${dividend.amount}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Dividends;
