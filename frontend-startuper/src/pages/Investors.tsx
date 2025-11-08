import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Search } from "lucide-react";

const investors = [
  {
    wallet: "rN7n7o...3ZwP9",
    campaign: "DeFi Exchange",
    invested: "2,500 XRP",
    tokens: "5,000 DEX",
    date: "2025-04-15",
  },
  {
    wallet: "rD3Hq8...7KmL2",
    campaign: "NFT Marketplace",
    invested: "1,800 XRP",
    tokens: "3,600 NFM",
    date: "2025-04-18",
  },
  {
    wallet: "rM9kP2...1BvN4",
    campaign: "DeFi Exchange",
    invested: "5,000 XRP",
    tokens: "10,000 DEX",
    date: "2025-04-20",
  },
  {
    wallet: "rX5jL9...8TcQ6",
    campaign: "Gaming Metaverse",
    invested: "3,200 XRP",
    tokens: "6,400 GMV",
    date: "2025-04-22",
  },
  {
    wallet: "rK4nW7...2YpR5",
    campaign: "NFT Marketplace",
    invested: "4,500 XRP",
    tokens: "9,000 NFM",
    date: "2025-04-25",
  },
];

export default function Investors() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Investors</h1>
          <p className="text-muted-foreground">
            View and manage your campaign investors
          </p>
        </div>

        {/* Filters and Actions */}
        <Card className="p-6 bg-card border-border shadow-card">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by wallet address..."
                className="pl-10"
              />
            </div>
            <Select>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Campaigns" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campaigns</SelectItem>
                <SelectItem value="defi">DeFi Exchange</SelectItem>
                <SelectItem value="nft">NFT Marketplace</SelectItem>
                <SelectItem value="gaming">Gaming Metaverse</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </Card>

        {/* Investors Table */}
        <Card className="bg-card border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead>Wallet Address</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Amount Invested</TableHead>
                  <TableHead>Tokens Issued</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {investors.map((investor, index) => (
                  <TableRow
                    key={index}
                    className="border-border hover:bg-secondary/30"
                  >
                    <TableCell className="font-mono text-sm">
                      {investor.wallet}
                    </TableCell>
                    <TableCell className="font-medium">
                      {investor.campaign}
                    </TableCell>
                    <TableCell className="text-primary font-semibold">
                      {investor.invested}
                    </TableCell>
                    <TableCell>{investor.tokens}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {investor.date}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-card border-border shadow-card">
            <p className="text-sm text-muted-foreground mb-2">
              Total Investors
            </p>
            <p className="text-2xl font-bold">666</p>
          </Card>
          <Card className="p-6 bg-card border-border shadow-card">
            <p className="text-sm text-muted-foreground mb-2">
              Average Investment
            </p>
            <p className="text-2xl font-bold">3,400 XRP</p>
          </Card>
          <Card className="p-6 bg-card border-border shadow-card">
            <p className="text-sm text-muted-foreground mb-2">
              This Month
            </p>
            <p className="text-2xl font-bold text-success">+89</p>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
