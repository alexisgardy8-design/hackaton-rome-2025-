import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Send, TrendingUp, Calendar, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const payoutHistory = [
  { month: "Jan", amount: 5000 },
  { month: "Feb", amount: 7500 },
  { month: "Mar", amount: 12000 },
  { month: "Apr", amount: 9500 },
  { month: "May", amount: 15000 },
];

export default function Dividends() {
  const { toast } = useToast();

  const handleSendPayment = () => {
    toast({
      title: "Batch Payment Initiated",
      description: "Dividend distribution will be processed on XRPL",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Dividend Management</h1>
          <p className="text-muted-foreground">
            Distribute earnings to your investors
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-card border-border shadow-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Total Distributed
                </p>
                <p className="text-2xl font-bold">49,000 XRP</p>
              </div>
              <div className="p-3 rounded-xl bg-success/10 border border-success/20">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
            </div>
          </Card>
          <Card className="p-6 bg-card border-border shadow-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Next Scheduled
                </p>
                <p className="text-2xl font-bold">May 15</p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Card>
          <Card className="p-6 bg-card border-border shadow-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Next Payout
                </p>
                <p className="text-2xl font-bold">12,000 XRP</p>
              </div>
              <div className="p-3 rounded-xl bg-warning/10 border border-warning/20">
                <DollarSign className="h-6 w-6 text-warning" />
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Send Payment Form */}
          <Card className="p-6 bg-card border-border shadow-card">
            <h3 className="text-lg font-semibold mb-6">Send Batch Payment</h3>
            <div className="space-y-6">
              <div>
                <Label htmlFor="campaign">Select Campaign</Label>
                <Select>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Choose campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="defi">DeFi Exchange</SelectItem>
                    <SelectItem value="nft">NFT Marketplace</SelectItem>
                    <SelectItem value="gaming">Gaming Metaverse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="amount">Total Payout Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="12000"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="token">Payment Token</Label>
                <Select>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select token" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="xrp">XRP</SelectItem>
                    <SelectItem value="usdt">USDT</SelectItem>
                    <SelectItem value="custom">Custom Token</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleSendPayment}
                className="w-full bg-gradient-primary"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Batch Payment
              </Button>
            </div>
          </Card>

          {/* Payout History Chart */}
          <Card className="p-6 bg-card border-border shadow-card">
            <h3 className="text-lg font-semibold mb-6">Payout History</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={payoutHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="month"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value) => `${value / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`${value.toLocaleString()} XRP`, "Distributed"]}
                />
                <Bar
                  dataKey="amount"
                  fill="hsl(var(--primary))"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Distribution Ratios */}
        <Card className="p-6 bg-card border-border shadow-card">
          <h3 className="text-lg font-semibold mb-4">
            Current Distribution Ratios
          </h3>
          <div className="space-y-3">
            {[
              { campaign: "DeFi Exchange", ratio: "40%", amount: "4,800 XRP" },
              { campaign: "NFT Marketplace", ratio: "30%", amount: "3,600 XRP" },
              { campaign: "Gaming Metaverse", ratio: "30%", amount: "3,600 XRP" },
            ].map((item) => (
              <div
                key={item.campaign}
                className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border"
              >
                <span className="font-medium">{item.campaign}</span>
                <div className="flex items-center gap-6">
                  <span className="text-sm text-muted-foreground">
                    {item.ratio}
                  </span>
                  <span className="font-semibold text-primary">
                    {item.amount}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
