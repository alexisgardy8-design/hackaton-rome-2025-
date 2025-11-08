import { Card } from "@/components/ui/card";
import { CheckCircle, Lock } from "lucide-react";

interface StatusItem {
  label: string;
  status: "active" | "locked";
}

const statusItems: StatusItem[] = [
  { label: "Escrow System", status: "active" },
  { label: "Token Issuance", status: "active" },
  { label: "Campaign #3", status: "locked" },
];

export function StatusCard() {
  return (
    <Card className="p-6 bg-card border-border shadow-card">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">System Status</h3>
        <p className="text-sm text-muted-foreground">Current platform state</p>
      </div>
      <div className="space-y-3">
        {statusItems.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border"
          >
            <span className="text-sm font-medium">{item.label}</span>
            <div className="flex items-center gap-2">
              {item.status === "active" ? (
                <>
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-xs text-success">Active</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 text-warning" />
                  <span className="text-xs text-warning">Locked</span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
