import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload, FileText, Download, Users, Database, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

import { apiClient } from "@/lib/api";
import type { DatapointDef } from "@/types/datapoint";

interface PlaceholderRequest {
  id: string;
  title: string;
  customer: string;
  status: "new" | "awaiting_data" | "in_review" | "ready";
  dueDate: string;
  completeness: number;
}

const placeholderRequests: PlaceholderRequest[] = [
  {
    id: "1",
    customer: "Demo Customer GmbH",
    title: "EcoVadis FY2025",
    status: "awaiting_data",
    dueDate: "2025-11-30",
    completeness: 0,
  },
  {
    id: "2",
    customer: "Demo Customer GmbH",
    title: "CDP Climate Change",
    status: "new",
    dueDate: "2025-12-15",
    completeness: 0,
  },
];

const statusConfig: Record<PlaceholderRequest["status"], { label: string; badgeClass: string }> = {
  new: { label: "New", badgeClass: "bg-muted text-muted-foreground" },
  awaiting_data: { label: "Awaiting Data", badgeClass: "bg-info text-info-foreground" },
  in_review: { label: "In Review", badgeClass: "bg-warning text-warning-foreground" },
  ready: { label: "Ready", badgeClass: "bg-success text-success-foreground" },
};

export default function Dashboard() {
  const { data: datapoints, isLoading, isError, error } = useQuery<DatapointDef[]>({
    queryKey: ["datapoints"],
    queryFn: () => apiClient.getDatapoints(),
  });

  const datapointCount = datapoints?.length ?? 0;

  const metricCards = [
    {
      name: "Canonical datapoints",
      icon: Database,
      content: (
        <>
          <div className="text-2xl font-bold">{datapointCount}</div>
          <p className="text-xs text-muted-foreground">Available for mapping</p>
        </>
      ),
    },
    {
      name: "Active requests",
      icon: Users,
      content: (
        <>
          <div className="text-2xl font-bold text-muted-foreground">Coming soon</div>
          <p className="text-xs text-muted-foreground">Waiting for live request feed</p>
        </>
      ),
    },
    {
      name: "Recent uploads",
      icon: Upload,
      content: (
        <>
          <div className="text-2xl font-bold text-muted-foreground">Coming soon</div>
          <p className="text-xs text-muted-foreground">Will display processed intakes</p>
        </>
      ),
    },
    {
      name: "Exports generated",
      icon: Download,
      content: (
        <>
          <div className="text-2xl font-bold text-muted-foreground">Coming soon</div>
          <p className="text-xs text-muted-foreground">History will surface here</p>
        </>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor your ESG data flow. Metrics that depend on live pipelines will light up as
          endpoints land.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.name} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.name}</CardTitle>
                <Icon className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>{card.content}</CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Canonical datapoints</CardTitle>
            <CardDescription>
              The blueprint-mandated ESRS datapoints available for uploads and exports.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 w-full" />
                ))}
              </div>
            )}

            {isError && (
              <div className="flex items-start space-x-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4" />
                <div>
                  <p className="font-medium">Failed to load datapoints</p>
                  <p className="text-muted-foreground">
                    {error instanceof Error ? error.message : "Unexpected error"}
                  </p>
                </div>
              </div>
            )}

            {!isLoading && !isError && datapoints && datapoints.length > 0 && (
              <div className="space-y-4">
                {datapoints.map((datapoint) => (
                  <div key={datapoint.key} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{datapoint.key}</p>
                        <p className="text-sm text-muted-foreground">{datapoint.description}</p>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <div>{datapoint.type}</div>
                        <div>{datapoint.unit}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isLoading && !isError && (!datapoints || datapoints.length === 0) && (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                No datapoints available yet. Seed the database using the provided SQL script.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start" variant="default">
              <Link to="/upload">
                <Upload className="mr-2 h-4 w-4" />
                Upload ESG Data
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link to="/requests">
                <FileText className="mr-2 h-4 w-4" />
                Review Data Requests
              </Link>
            </Button>
            <Button asChild className="w-full justify-start" variant="outline">
              <Link to="/exports">
                <Download className="mr-2 h-4 w-4" />
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