import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { MetricCard } from "@/components/Dashboard/MetricCard";
import { FundingChart } from "@/components/Dashboard/FundingChart";
import { StatusCard } from "@/components/Dashboard/StatusCard";
import {
  TrendingUp,
  Rocket,
  Users,
  Calendar,
} from "lucide-react";

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's your campaign overview.
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Funds Raised"
            value="$58,340"
            change="+12.5% from last month"
            icon={TrendingUp}
            trend="up"
          />
          <MetricCard
            title="Active Campaigns"
            value="3"
            change="2 ending soon"
            icon={Rocket}
            trend="neutral"
          />
          <MetricCard
            title="Total Investors"
            value="247"
            change="+34 this week"
            icon={Users}
            trend="up"
          />
          <MetricCard
            title="Next Dividend"
            value="May 15"
            change="$12,000 payout"
            icon={Calendar}
            trend="neutral"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <FundingChart />
          </div>
          <div>
            <StatusCard />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
