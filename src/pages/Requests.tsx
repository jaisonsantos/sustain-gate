import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  Calendar,
  Building2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter
} from "lucide-react";
import { cn } from "@/lib/utils";

type RequestStatus = "new" | "awaiting_data" | "in_review" | "ready" | "delivered";
type RequestPriority = "high" | "medium" | "low";

interface DataRequest {
  id: string;
  customer: string;
  title: string;
  status: RequestStatus;
  dueDate: string;
  completeness: number;
  requiredKeys: string[];
  priority: RequestPriority;
}

const requestStatuses: { id: RequestStatus; label: string; color: string }[] = [
  { id: "new", label: "New", color: "bg-info text-info-foreground" },
  { id: "awaiting_data", label: "Awaiting Data", color: "bg-warning text-warning-foreground" },
  { id: "in_review", label: "In Review", color: "bg-accent text-accent-foreground" },
  { id: "ready", label: "Ready", color: "bg-success text-success-foreground" },
  { id: "delivered", label: "Delivered", color: "bg-muted text-muted-foreground" },
];

const sampleRequests: DataRequest[] = [
  {
    id: "1",
    customer: "Green Corp GmbH",
    title: "EcoVadis FY2025 Assessment",
    status: "in_review",
    dueDate: "2025-11-30",
    completeness: 85,
    requiredKeys: ["energy.electricity_kwh", "water.m3_total", "waste.total_kg"],
    priority: "high",
  },
  {
    id: "2",
    customer: "Sustainable Industries",
    title: "CDP Climate Change Response",
    status: "awaiting_data",
    dueDate: "2025-12-15",
    completeness: 40,
    requiredKeys: ["energy.electricity_kwh", "energy.fuels_liters", "freight.ton_km_road"],
    priority: "medium",
  },
  {
    id: "3",
    customer: "ESG Partners Ltd",
    title: "Custom ESG Assessment Q4",
    status: "ready",
    dueDate: "2025-10-20",
    completeness: 100,
    requiredKeys: ["energy.renewable_pct", "policy.has_esg_policy"],
    priority: "low",
  },
  {
    id: "4",
    customer: "Green Supply Chain",
    title: "Supply Chain Assessment",
    status: "new",
    dueDate: "2025-12-01",
    completeness: 0,
    requiredKeys: ["materials.recycled_content_pct", "packaging.kg_total"],
    priority: "high",
  },
];

const getPriorityColor = (priority: RequestPriority) => {
  switch (priority) {
    case "high": return "border-l-destructive";
    case "medium": return "border-l-warning";
    case "low": return "border-l-success";
    default: return "border-l-muted";
  }
};

export default function Requests() {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRequests = sampleRequests.filter(request => {
    const matchesStatus = !selectedStatus || request.status === selectedStatus;
    const matchesSearch = !searchQuery || 
      request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.customer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Requests</h1>
          <p className="text-muted-foreground">
            Manage ESG data requests from your customers
          </p>
        </div>
        <Button className="shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          New Request
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={selectedStatus === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedStatus(null)}
        >
          All ({sampleRequests.length})
        </Button>
        {requestStatuses.map((status) => {
          const count = sampleRequests.filter(r => r.status === status.id).length;
          return (
            <Button
              key={status.id}
              variant={selectedStatus === status.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedStatus(status.id)}
            >
              {status.label} ({count})
            </Button>
          );
        })}
      </div>

      {/* Kanban Board */}
      <div className="grid gap-6 lg:grid-cols-5 min-h-[600px]">
        {requestStatuses.map((status) => {
          const statusRequests = filteredRequests.filter(r => r.status === status.id);
          return (
            <div key={status.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                  {status.label}
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {statusRequests.length}
                </Badge>
              </div>
              
              <div className="space-y-3">
                {statusRequests.map((request) => (
                  <Card 
                    key={request.id} 
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md border-l-4",
                      getPriorityColor(request.priority)
                    )}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-sm font-medium leading-tight">
                          {request.title}
                        </CardTitle>
                        <Badge className={status.color} variant="secondary">
                          {request.completeness}%
                        </Badge>
                      </div>
                      <CardDescription className="text-xs">
                        <div className="flex items-center gap-1 mt-1">
                          <Building2 className="w-3 h-3" />
                          {request.customer}
                        </div>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {/* Progress Bar */}
                        <div className="w-full h-2 bg-muted rounded-full">
                          <div 
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${request.completeness}%` }}
                          />
                        </div>
                        
                        {/* Due Date */}
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3 mr-1" />
                          Due: {request.dueDate}
                        </div>
                        
                        {/* Required Keys */}
                        <div className="text-xs text-muted-foreground">
                          {request.requiredKeys.length} data points required
                        </div>
                        
                        {/* Priority Indicator */}
                        <div className="flex items-center justify-between">
                          <div className={cn(
                            "text-xs px-2 py-1 rounded-full",
                            request.priority === "high" && "bg-destructive/10 text-destructive",
                            request.priority === "medium" && "bg-warning/10 text-warning",
                            request.priority === "low" && "bg-success/10 text-success"
                          )}>
                            {request.priority} priority
                          </div>
                          
                          {request.status === "ready" && (
                            <CheckCircle className="w-4 h-4 text-success" />
                          )}
                          {request.status === "awaiting_data" && (
                            <AlertTriangle className="w-4 h-4 text-warning" />
                          )}
                          {request.status === "in_review" && (
                            <Clock className="w-4 h-4 text-info" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {statusRequests.length === 0 && selectedStatus === null && (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    No requests in this status
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}