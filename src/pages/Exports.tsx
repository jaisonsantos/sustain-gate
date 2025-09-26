import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  Package,
  Calendar,
  Loader2,
  Inbox,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";

interface ExportItem {
  id: string;
  template: string;
  status: "queued" | "done" | "failed";
  createdAt: string;
  supplierId: string;
  requestId: string;
  periodStart: string;
  periodEnd: string;
  zipPath?: string;
}

const templates = [
  { id: "ecovadis_basic", name: "EcoVadis Basic", description: "Standard EcoVadis assessment" },
  { id: "cdp_basic", name: "CDP Climate", description: "CDP Climate Change snapshot" },
];

const supplierOptions = [
  {
    id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    name: "DEMO Supplier Ltd",
  },
];

const requestOptions = [
  {
    id: "dddddddd-eeee-ffff-0000-111111111111",
    title: "EcoVadis FY2025 Demo",
  },
];

export default function Exports() {
  const { toast } = useToast();
  const [exports, setExports] = useState<ExportItem[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>(templates[0]?.id ?? "");
  const [supplierId, setSupplierId] = useState<string>(supplierOptions[0]?.id ?? "");
  const [requestId, setRequestId] = useState<string>(requestOptions[0]?.id ?? "");
  const [periodStart, setPeriodStart] = useState<string>("");
  const [periodEnd, setPeriodEnd] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  const recentExports = useMemo(() => exports, [exports]);

  const handleCreateExport = async () => {
    if (!selectedTemplate || !supplierId || !requestId || !periodStart || !periodEnd) {
      toast({
        title: "Incomplete form",
        description: "Fill in all fields before creating an export.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      const payload = {
        supplier_id: supplierId,
        request_id: requestId,
        period_start: periodStart,
        period_end: periodEnd,
      };
      const response = await apiClient.createExport(selectedTemplate, payload);

      const newExport: ExportItem = {
        id: response.export_id,
        template: response.template,
        status: response.status as ExportItem["status"],
        createdAt: new Date().toISOString(),
        supplierId,
        requestId,
        periodStart,
        periodEnd,
        zipPath: response.zip_path,
      };

      setExports((prev) => [newExport, ...prev]);

      toast({
        title: "Export ready",
        description: `Export ${response.export_id} generated successfully`,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create export. Please retry.";
      toast({
        title: "Export failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDownload = async (exportItem: ExportItem) => {
    if (!exportItem.zipPath) {
      toast({
        title: "No artifact",
        description: "The export has no downloadable ZIP yet.",
        variant: "destructive",
      });
      return;
    }

    setDownloading(exportItem.id);
    try {
      const blob = await apiClient.downloadExport(exportItem.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${exportItem.template}-${exportItem.id}.zip`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({
        title: "Download started",
        description: `${exportItem.template} package is downloading`,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to download export";
      toast({
        title: "Download failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exports & Dossiers</h1>
          <p className="text-muted-foreground">
            Generate EcoVadis-compatible ZIP bundles directly from validated intakes.
          </p>
        </div>
        <Button onClick={handleCreateExport} disabled={isCreating}>
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating export...
            </>
          ) : (
            <>
              <Package className="mr-2 h-4 w-4" />
              Create export
            </>
          )}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate new export</CardTitle>
          <CardDescription>Provide context for the export job you want to run.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Template</label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="space-y-1">
                        <div className="font-medium">{template.name}</div>
                        <div className="text-xs text-muted-foreground">{template.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Supplier</label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {supplierOptions.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data request</label>
              <Select value={requestId} onValueChange={setRequestId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select request" />
                </SelectTrigger>
                <SelectContent>
                  {requestOptions.map((request) => (
                    <SelectItem key={request.id} value={request.id}>
                      {request.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Period start</label>
              <Input type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Period end</label>
              <Input type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Request UUID</label>
              <Input value={requestId} readOnly className="font-mono text-xs" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setPeriodStart("");
              setPeriodEnd("");
            }}>
              Reset
            </Button>
            <Button onClick={handleCreateExport} disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Package className="mr-2 h-4 w-4" />
                  Generate export
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent exports</CardTitle>
          <CardDescription>Downloads are available immediately after generation.</CardDescription>
        </CardHeader>
        <CardContent>
          {recentExports.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
              <Inbox className="h-10 w-10" />
              <p>No exports yet. Generate your first EcoVadis bundle above.</p>
            </div>
          )}

          {recentExports.length > 0 && (
            <div className="space-y-4">
              {recentExports.map((exportItem) => (
                <div
                  key={exportItem.id}
                  className="flex flex-col gap-4 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{exportItem.template}</p>
                      <Badge
                        className={
                          exportItem.status === "done"
                            ? "bg-success text-success-foreground"
                            : exportItem.status === "failed"
                            ? "bg-destructive text-destructive-foreground"
                            : "bg-info/10 text-info"
                        }
                      >
                        {exportItem.status === "done" ? "Ready" : exportItem.status === "failed" ? "Failed" : "Queued"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Supplier {exportItem.supplierId} • Request {exportItem.requestId}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <Calendar className="mr-1 inline h-3 w-3" />
                      {new Date(exportItem.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {exportItem.status === "done" && (
                      <Button
                        size="sm"
                        onClick={() => handleDownload(exportItem)}
                        disabled={downloading === exportItem.id}
                      >
                        {downloading === exportItem.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Preparing...
                          </>
                        ) : (
                          <>
                            <Download className="mr-2 h-4 w-4" />
                            Download ZIP
                          </>
                        )}
                      </Button>
                    )}

                    {exportItem.status === "failed" && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Needs retry
                      </Badge>
                    )}

                    {exportItem.status === "done" && (
                      <Badge variant="outline" className="flex items-center gap-1 text-xs">
                        <CheckCircle2 className="h-3 w-3 text-success" />
                        Ready for EcoVadis upload
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
