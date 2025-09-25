import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Upload,
  FileText,
  Download,
  Users
} from "lucide-react";
import { Link } from "react-router-dom";

const stats = [
  {
    name: "Active Requests",
    value: "12",
    change: "+2 from last week",
    icon: FileText,
    color: "text-info"
  },
  {
    name: "Data Uploads",
    value: "8",
    change: "+3 this month",
    icon: Upload,
    color: "text-success"
  },
  {
    name: "Exports Generated",
    value: "24",
    change: "+12 this month",
    icon: Download,
    color: "text-accent"
  },
  {
    name: "Active Customers",
    value: "6",
    change: "+1 this quarter",
    icon: Users,
    color: "text-primary"
  }
];

const recentRequests = [
  {
    id: "1",
    customer: "Green Corp GmbH",
    title: "EcoVadis FY2025",
    status: "in_review",
    dueDate: "2025-11-30",
    completeness: 85
  },
  {
    id: "2", 
    customer: "Sustainable Industries",
    title: "CDP Climate Change",
    status: "awaiting_data",
    dueDate: "2025-12-15",
    completeness: 40
  },
  {
    id: "3",
    customer: "ESG Partners Ltd",
    title: "Custom Assessment Q4",
    status: "ready",
    dueDate: "2025-10-20",
    completeness: 100
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "ready": return "bg-success text-success-foreground";
    case "in_review": return "bg-warning text-warning-foreground";
    case "awaiting_data": return "bg-info text-info-foreground";
    default: return "bg-muted text-muted-foreground";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "ready": return "Ready";
    case "in_review": return "In Review";
    case "awaiting_data": return "Awaiting Data";
    default: return status;
  }
};

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor your ESG data requests and sustainability reporting
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.name}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Requests */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Data Requests</CardTitle>
            <CardDescription>
              Latest ESG data requests from your customers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">{request.title}</p>
                    <p className="text-sm text-muted-foreground">{request.customer}</p>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(request.status)}>
                        {getStatusLabel(request.status)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Due: {request.dueDate}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{request.completeness}%</div>
                    <div className="w-16 h-2 bg-muted rounded-full mt-1">
                      <div 
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${request.completeness}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button asChild variant="outline" className="w-full">
                <Link to="/requests">View All Requests</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start" variant="default">
              <Link to="/upload">
                <Upload className="w-4 h-4 mr-2" />
                Upload ESG Data
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link to="/requests">
                <FileText className="w-4 h-4 mr-2" />
                Create Request
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link to="/exports">
                <Download className="w-4 h-4 mr-2" />
                Generate Export
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* ESG Data Overview */}
      <Card>
        <CardHeader>
          <CardTitle>ESG Data Coverage</CardTitle>
          <CardDescription>
            Current data completeness across key sustainability metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Energy Data</span>
                <span className="text-sm text-muted-foreground">92%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full">
                <div className="h-full w-[92%] bg-success rounded-full" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Water & Waste</span>
                <span className="text-sm text-muted-foreground">78%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full">
                <div className="h-full w-[78%] bg-warning rounded-full" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Transportation</span>
                <span className="text-sm text-muted-foreground">65%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full">
                <div className="h-full w-[65%] bg-info rounded-full" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}