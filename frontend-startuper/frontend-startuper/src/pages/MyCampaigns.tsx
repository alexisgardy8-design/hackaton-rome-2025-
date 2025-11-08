import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Eye, DollarSign } from "lucide-react";

const campaigns = [
  {
    id: 1,
    name: "DeFi Exchange Platform",
    status: "active",
    funded: 75,
    raised: "75,000 XRP",
    target: "100,000 XRP",
    token: "DEX",
    investors: 143,
  },
  {
    id: 2,
    name: "NFT Marketplace",
    status: "active",
    funded: 45,
    raised: "22,500 XRP",
    target: "50,000 XRP",
    token: "NFM",
    investors: 67,
  },
  {
    id: 3,
    name: "Gaming Metaverse",
    status: "closed",
    funded: 100,
    raised: "200,000 XRP",
    target: "200,000 XRP",
    token: "GMV",
    investors: 456,
  },
];

export default function MyCampaigns() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Campaigns</h1>
            <p className="text-muted-foreground">
              Manage and track your fundraising campaigns
            </p>
          </div>
          <Button className="bg-gradient-primary">
            Create New Campaign
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-card border-border shadow-card">
            <p className="text-sm text-muted-foreground mb-2">Total Raised</p>
            <p className="text-2xl font-bold">297,500 XRP</p>
          </Card>
          <Card className="p-6 bg-card border-border shadow-card">
            <p className="text-sm text-muted-foreground mb-2">Active Campaigns</p>
            <p className="text-2xl font-bold">2</p>
          </Card>
          <Card className="p-6 bg-card border-border shadow-card">
            <p className="text-sm text-muted-foreground mb-2">Total Investors</p>
            <p className="text-2xl font-bold">666</p>
          </Card>
        </div>

        {/* Campaigns List */}
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <Card
              key={campaign.id}
              className="p-6 bg-card border-border shadow-card hover:border-primary/40 transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-4 flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">
                        {campaign.name}
                      </h3>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={
                            campaign.status === "active"
                              ? "default"
                              : "secondary"
                          }
                          className={
                            campaign.status === "active"
                              ? "bg-success/20 text-success border-success/30"
                              : ""
                          }
                        >
                          {campaign.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Token: {campaign.token}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">
                        {campaign.raised} / {campaign.target}
                      </span>
                    </div>
                    <Progress value={campaign.funded} className="h-2" />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {campaign.funded}% funded
                      </span>
                      <span className="text-muted-foreground">
                        {campaign.investors} investors
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  <Button variant="outline" size="sm">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Manage Dividends
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
