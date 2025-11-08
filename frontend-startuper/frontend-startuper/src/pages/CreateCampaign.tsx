import { useState } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronRight, ChevronLeft, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const steps = [
  "Project Info",
  "Funding Details",
  "Token Setup",
  "Escrow Config",
  "Preview",
];

export default function CreateCampaign() {
  const [currentStep, setCurrentStep] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast } = useToast();

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleLaunch = () => {
    setShowSuccess(true);
    toast({
      title: "Campaign Created!",
      description: "Your campaign is now live on XRPL Testnet",
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Create New Campaign</h1>
          <p className="text-muted-foreground">
            Launch your fundraising campaign on XRPL
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center">
              <div
                className={`flex items-center justify-center h-10 w-10 rounded-full border-2 transition-all ${
                  index <= currentStep
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground"
                }`}
              >
                {index < currentStep ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-0.5 w-12 lg:w-20 mx-2 transition-all ${
                    index < currentStep ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <Card className="p-8 bg-card border-border shadow-card">
          <h2 className="text-xl font-semibold mb-6">
            {steps[currentStep]}
          </h2>

          {/* Step 0: Project Info */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your project name"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="defi">DeFi</SelectItem>
                    <SelectItem value="nft">NFT</SelectItem>
                    <SelectItem value="gaming">Gaming</SelectItem>
                    <SelectItem value="infrastructure">Infrastructure</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your project..."
                  className="mt-2 min-h-32"
                />
              </div>
            </div>
          )}

          {/* Step 1: Funding Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="target">Target Amount (XRP)</Label>
                <Input
                  id="target"
                  type="number"
                  placeholder="100000"
                  className="mt-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="min">Min Contribution</Label>
                  <Input
                    id="min"
                    type="number"
                    placeholder="100"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="max">Max Contribution</Label>
                  <Input
                    id="max"
                    type="number"
                    placeholder="10000"
                    className="mt-2"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="deadline">Campaign Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  className="mt-2"
                />
              </div>
            </div>
          )}

          {/* Step 2: Token Setup */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="token-name">Token Name</Label>
                  <Input
                    id="token-name"
                    placeholder="MyToken"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="token-symbol">Symbol</Label>
                  <Input
                    id="token-symbol"
                    placeholder="MTK"
                    className="mt-2"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="supply">Total Supply</Label>
                <Input
                  id="supply"
                  type="number"
                  placeholder="1000000"
                  className="mt-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="offered">% Offered</Label>
                  <Input
                    id="offered"
                    type="number"
                    placeholder="20"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="price">Token Price (XRP)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="0.50"
                    className="mt-2"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Escrow Config */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="release">Release Condition</Label>
                <Select>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="time">Time-based</SelectItem>
                    <SelectItem value="milestone">Milestone-based</SelectItem>
                    <SelectItem value="manual">Manual Release</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="lock-period">Lock Period (days)</Label>
                <Input
                  id="lock-period"
                  type="number"
                  placeholder="90"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="escrow-notes">Additional Notes</Label>
                <Textarea
                  id="escrow-notes"
                  placeholder="Add any special conditions..."
                  className="mt-2"
                />
              </div>
            </div>
          )}

          {/* Step 4: Preview */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <h3 className="font-semibold mb-2">Campaign Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Project:</span>
                    <span className="font-medium">Your Project Name</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Target:</span>
                    <span className="font-medium">100,000 XRP</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Token:</span>
                    <span className="font-medium">MTK (1M supply)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lock Period:</span>
                    <span className="font-medium">90 days</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Review all details carefully before launching your campaign on XRPL Testnet.
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-border">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            {currentStep === steps.length - 1 ? (
              <Button onClick={handleLaunch} className="bg-gradient-primary">
                Launch Campaign
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-success" />
            </div>
            <DialogTitle className="text-center">Campaign Created!</DialogTitle>
            <DialogDescription className="text-center">
              Your campaign has been successfully created on XRPL Testnet.
              Investors can now discover and contribute to your project.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setShowSuccess(false)} className="w-full">
            View My Campaigns
          </Button>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
