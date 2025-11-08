import { mockInvestments, mockDividends } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Coins, Calendar } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const MyInvestments = () => {
  const totalInvested = mockInvestments.reduce((sum, inv) => sum + inv.investedAmount, 0);
  const totalValue = mockInvestments.reduce((sum, inv) => sum + inv.currentValue, 0);
  const totalGain = totalValue - totalInvested;
  const avgROI = (totalGain / totalInvested) * 100;

  const stats = [
    { 
      label: 'Total Invested', 
      value: `$${totalInvested.toLocaleString()}`, 
      icon: DollarSign,
      color: 'text-primary' 
    },
    { 
      label: 'Current Value', 
      value: `$${totalValue.toLocaleString()}`, 
      icon: Coins,
      color: 'text-primary' 
    },
    { 
      label: 'Total Gain', 
      value: `$${totalGain.toLocaleString()}`, 
      icon: totalGain >= 0 ? TrendingUp : TrendingDown,
      color: totalGain >= 0 ? 'text-success' : 'text-destructive' 
    },
    { 
      label: 'Average ROI', 
      value: `${avgROI.toFixed(1)}%`, 
      icon: TrendingUp,
      color: avgROI >= 0 ? 'text-success' : 'text-destructive' 
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            My <span className="text-gradient">Investments</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Track your portfolio performance and dividend history across all projects.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Active Investments</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead className="text-right">Invested</TableHead>
                    <TableHead className="text-right">Tokens Held</TableHead>
                    <TableHead className="text-right">Current Value</TableHead>
                    <TableHead className="text-right">ROI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockInvestments.map((investment) => (
                    <TableRow key={investment.projectId}>
                      <TableCell className="font-medium">{investment.projectName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{investment.symbol}</Badge>
                      </TableCell>
                      <TableCell className="text-right">${investment.investedAmount.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{investment.tokensHeld.toLocaleString()}</TableCell>
                      <TableCell className="text-right">${investment.currentValue.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <span className={investment.roi >= 0 ? 'text-success' : 'text-destructive'}>
                          {investment.roi >= 0 ? '+' : ''}{investment.roi}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Recent Dividend Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockDividends.slice(0, 5).map((dividend, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{dividend.projectName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{dividend.symbol}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                          {dividend.date}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-success font-semibold">
                        +${dividend.amount}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default MyInvestments;
