import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, X } from "lucide-react";

interface SelectedLeadBreadcrumbProps {
  leadName: string | null;
  onClearSelection: () => void;
}

export function SelectedLeadBreadcrumb({ leadName, onClearSelection }: SelectedLeadBreadcrumbProps) {
  if (!leadName) return null;

  return (
    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg border">
      <User className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">Lead selecionado:</span>
      <Badge variant="secondary" className="font-medium">
        {leadName}
      </Badge>
      <Button
        size="sm"
        variant="ghost"
        onClick={onClearSelection}
        className="h-6 w-6 p-0"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}