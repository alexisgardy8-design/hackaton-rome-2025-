import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Wallet, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "Your profile has been updated successfully",
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account and preferences
          </p>
        </div>

        {/* Profile Settings */}
        <Card className="p-6 bg-card border-border shadow-card">
          <h3 className="text-lg font-semibold mb-6">Profile Information</h3>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="company">Company Name</Label>
                <Input
                  id="company"
                  placeholder="Your Startup Inc."
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="founder@startup.com"
                  className="mt-2"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="bio">Company Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about your company..."
                className="mt-2 min-h-24"
              />
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                placeholder="https://yourstartup.com"
                className="mt-2"
              />
            </div>
          </div>
        </Card>

        {/* Wallet Connection */}
        <Card className="p-6 bg-card border-border shadow-card">
          <h3 className="text-lg font-semibold mb-6">Wallet Connection</h3>
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">XRPL Wallet</p>
                  <p className="text-sm text-muted-foreground font-mono">
                    rN7n7o...3ZwP9
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Disconnect
              </Button>
            </div>
            <Button variant="outline" className="w-full">
              Connect New Wallet (XUMM)
            </Button>
          </div>
        </Card>

        {/* Notification Settings */}
        <Card className="p-6 bg-card border-border shadow-card">
          <h3 className="text-lg font-semibold mb-6">Notifications</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Investment Alerts</p>
                <p className="text-sm text-muted-foreground">
                  Get notified when someone invests in your campaigns
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Campaign Updates</p>
                <p className="text-sm text-muted-foreground">
                  Receive updates about your campaign milestones
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Dividend Reminders</p>
                <p className="text-sm text-muted-foreground">
                  Get reminded about upcoming dividend payouts
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </Card>

        {/* Appearance */}
        <Card className="p-6 bg-card border-border shadow-card">
          <h3 className="text-lg font-semibold mb-6">Appearance</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Dark Mode</p>
              <p className="text-sm text-muted-foreground">
                Currently using dark theme (default)
              </p>
            </div>
            <Switch defaultChecked disabled />
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} className="bg-gradient-primary">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
