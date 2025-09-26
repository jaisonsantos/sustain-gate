import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  Upload as UploadIcon,
  FileText,
  AlertTriangle,
  X,
  Download,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api";
import type { DatapointDef } from "@/types/datapoint";
import type { IntakeIssue } from "@/types/intake";

interface UploadEntry {
  id: string;
  name: string;
  size: number;
  status:
    | "uploading"
    | "uploaded"
    | "parsing"
    | "validating"
    | "validated"
    | "publishing"
    | "published"
    | "error";
  intakeId?: string;
  warnings?: IntakeIssue[];
  errors?: IntakeIssue[];
  errorMessage?: string;
}

const supplierOptions = [
  {
    id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    name: "DEMO Supplier Ltd",
  },
];

const statusConfig: Record<UploadEntry["status"], { label: string; badgeClass: string }> = {
  uploading: { label: "Uploading", badgeClass: "bg-info/10 text-info" },
  uploaded: { label: "Uploaded", badgeClass: "bg-muted text-foreground" },
  parsing: { label: "Parsing", badgeClass: "bg-muted text-muted-foreground" },
  validating: { label: "Validating", badgeClass: "bg-warning/10 text-warning" },
  validated: { label: "Validated", badgeClass: "bg-success/10 text-success" },
  publishing: { label: "Publishing", badgeClass: "bg-info/10 text-info" },
  published: { label: "Published", badgeClass: "bg-success text-success-foreground" },
  error: { label: "Action required", badgeClass: "bg-destructive text-destructive-foreground" },
};

function formatFileSize(bytes: number) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function formatIssues(issues?: IntakeIssue[]) {
  if (!issues || issues.length === 0) return "None";
  return issues.map((issue) => `${issue.field}: ${issue.message}`).join("; ");
}

export default function Upload() {
  const [files, setFiles] = useState<UploadEntry[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [supplierId, setSupplierId] = useState(() => supplierOptions[0]?.id ?? "");
  const [periodStart, setPeriodStart] = useState<string>("");
  const [periodEnd, setPeriodEnd] = useState<string>("");
  const { toast } = useToast();

  const { data: datapoints } = useQuery<DatapointDef[]>({
    queryKey: ["datapoints"],
    queryFn: () => apiClient.getDatapoints(),
  });

  const resetDragState = useCallback(() => setIsDragging(false), []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    resetDragState();
  }, [resetDragState]);

  const processFile = useCallback(
    async (entryId: string, file: File) => {
      try {
        const uploadResponse = await apiClient.uploadIntake(
          file,
          supplierId,
          periodStart,
          periodEnd
        );
        setFiles((prev) =>
          prev.map((item) =>
            item.id === entryId
              ? { ...item, status: "uploaded", intakeId: uploadResponse.intake_id }
              : item
          )
        );
        toast({
          title: "Upload completed",
          description: `${file.name} stored as intake ${uploadResponse.intake_id}`,
        });

        setFiles((prev) =>
          prev.map((item) => (item.id === entryId ? { ...item, status: "parsing" } : item))
        );

        await new Promise((resolve) => setTimeout(resolve, 0));

        setFiles((prev) =>
          prev.map((item) => (item.id === entryId ? { ...item, status: "validating" } : item))
        );

        const validation = await apiClient.validateIntake(uploadResponse.intake_id);
        setFiles((prev) =>
          prev.map((item) =>
            item.id === entryId
              ? {
                  ...item,
                  status: validation.errors.length > 0 ? "error" : "validated",
                  warnings: validation.warnings,
                  errors: validation.errors,
                }
              : item
          )
        );

        if (validation.errors.length > 0) {
          toast({
            title: "Validation issues",
            description: `${file.name} needs attention: ${formatIssues(validation.errors)}`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Validation successful",
            description: `${file.name} is ready to publish`,
          });
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unexpected error while processing the file.";
        setFiles((prev) =>
          prev.map((item) =>
            item.id === entryId
              ? {
                  ...item,
                  status: "error",
                  errorMessage: message,
                }
              : item
          )
        );
        toast({
          title: "Upload failed",
          description: message,
          variant: "destructive",
        });
      }
    },
    [periodEnd, periodStart, supplierId, toast]
  );

  const handleFiles = useCallback(
    (selectedFiles: File[]) => {
      if (!supplierId || !periodStart || !periodEnd) {
        toast({
          title: "Missing metadata",
          description: "Select supplier and reporting period before uploading files.",
          variant: "destructive",
      });
      return;
    }

    if (new Date(periodStart) > new Date(periodEnd)) {
      toast({
        title: "Invalid reporting window",
        description: "The end period must be after the start period.",
        variant: "destructive",
      });
      return;
    }

    selectedFiles.forEach((file) => {
      const entryId = crypto.randomUUID();
      const newEntry: UploadEntry = {
        id: entryId,
        name: file.name,
        size: file.size,
        status: "uploading",
      };
      setFiles((prev) => [newEntry, ...prev]);
      void processFile(entryId, file);
    });
    },
    [periodEnd, periodStart, processFile, supplierId, toast]
  );

  const handleFileInput = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files?.length) {
        handleFiles(Array.from(event.target.files));
        event.target.value = "";
      }
    },
    [handleFiles]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      resetDragState();
      if (event.dataTransfer.files?.length) {
        handleFiles(Array.from(event.dataTransfer.files));
      }
    },
    [handleFiles, resetDragState]
  );

  const handlePublish = async (entry: UploadEntry) => {
    if (!entry.intakeId) return;
    setFiles((prev) =>
      prev.map((item) => (item.id === entry.id ? { ...item, status: "publishing" } : item))
    );

    try {
      const publishResponse = await apiClient.publishIntake(entry.intakeId);
      setFiles((prev) =>
        prev.map((item) =>
          item.id === entry.id
            ? { ...item, status: "published", intakeId: publishResponse.intake_id }
            : item
        )
      );
      toast({
        title: "Intake published",
        description: `${entry.name} is now available for exports`,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to publish intake. Please retry.";
      setFiles((prev) =>
        prev.map((item) =>
          item.id === entry.id
            ? { ...item, status: "error", errorMessage: message }
            : item
        )
      );
      toast({
        title: "Publish failed",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleRevalidate = async (entry: UploadEntry) => {
    if (!entry.intakeId) return;
    setFiles((prev) =>
      prev.map((item) => (item.id === entry.id ? { ...item, status: "validating" } : item))
    );

    try {
      const validation = await apiClient.validateIntake(entry.intakeId);
      setFiles((prev) =>
        prev.map((item) =>
          item.id === entry.id
            ? {
                ...item,
                status: validation.errors.length > 0 ? "error" : "validated",
                warnings: validation.warnings,
                errors: validation.errors,
              }
            : item
        )
      );

      if (validation.errors.length > 0) {
        toast({
          title: "Validation issues",
          description: formatIssues(validation.errors),
          variant: "destructive",
        });
      } else {
        toast({
          title: "Validation successful",
          description: `${entry.name} is ready to publish`,
        });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Validation failed. Please retry.";
      setFiles((prev) =>
        prev.map((item) =>
          item.id === entry.id ? { ...item, status: "error", errorMessage: message } : item
        )
      );
      toast({
        title: "Validation failed",
        description: message,
        variant: "destructive",
      });
    }
  };

  const removeFile = (entryId: string) => {
    setFiles((prev) => prev.filter((item) => item.id !== entryId));
  };

  const handleDownloadTemplate = () => {
    if (!datapoints || datapoints.length === 0) {
      toast({
        title: "Template unavailable",
        description: "Seed datapoints before exporting the CSV template.",
        variant: "destructive",
      });
      return;
    }

    const headerRow = datapoints.map((point) => point.key).join(",");
    const csvContent = `${headerRow}\n`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "ssdr-demo-template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({
      title: "Template downloaded",
      description: "Populate the CSV and upload it using the form above.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload ESG Data</h1>
        <p className="text-muted-foreground">
          Upload CSV or Excel files, validate them against the canonical datapoints and publish the
          intake.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
          <CardDescription>Select the supplier and reporting window for this upload.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="supplier">
                Supplier
              </label>
              <select
                id="supplier"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                value={supplierId}
                onChange={(event) => setSupplierId(event.target.value)}
              >
                {supplierOptions.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Demo supplier seeded via <code>api/seed/demo_seed.sql</code>
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="period-start">
                Period start
              </label>
              <Input
                id="period-start"
                type="date"
                value={periodStart}
                onChange={(event) => setPeriodStart(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="period-end">
                Period end
              </label>
              <Input
                id="period-end"
                type="date"
                value={periodEnd}
                onChange={(event) => setPeriodEnd(event.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-dashed">
        <CardContent className="p-8">
          <div
            className={cn(
              "flex flex-col items-center justify-center space-y-4 transition-colors",
              isDragging && "bg-primary/5"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <UploadIcon className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Upload your ESG data files</h3>
              <p className="text-muted-foreground">
                Drag and drop CSV or XLSX files here, or click to browse
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <label htmlFor="file-upload">
                <Button asChild variant="default" className="cursor-pointer">
                  <span>
                    <UploadIcon className="mr-2 h-4 w-4" />
                    Choose files
                  </span>
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={handleFileInput}
                />
              </label>
              <Button variant="outline" onClick={handleDownloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Download template
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              Supported formats: CSV, XLSX, XLS (max 10MB per file)
            </div>
          </div>
        </CardContent>
      </Card>

      {files.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center space-y-4 py-12 text-center">
            <ShieldCheck className="h-10 w-10 text-muted-foreground" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">No uploads yet</h3>
              <p className="text-sm text-muted-foreground">
                Upload a CSV or Excel file to start the intake → validation → publish journey.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload activity</CardTitle>
            <CardDescription>Track status, warnings, and publication readiness.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files.map((file) => {
                const status = statusConfig[file.status];
                const hasBlockingErrors = file.errors && file.errors.length > 0;
                return (
                  <div
                    key={file.id}
                    className="flex flex-col gap-4 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex flex-1 items-start gap-3">
                      <FileText className="mt-1 h-6 w-6 text-muted-foreground" />
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{file.name}</p>
                          <Badge className={status.badgeClass}>{status.label}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                          {file.intakeId ? ` • Intake ${file.intakeId}` : ""}
                        </p>
                        {file.warnings && file.warnings.length > 0 && (
                          <div className="flex items-start gap-1 text-xs text-warning">
                            <AlertTriangle className="mt-0.5 h-3 w-3" />
                            <span>{formatIssues(file.warnings)}</span>
                          </div>
                        )}
                        {hasBlockingErrors && (
                          <div className="flex items-start gap-1 text-xs text-destructive">
                            <X className="mt-0.5 h-3 w-3" />
                            <span>{formatIssues(file.errors)}</span>
                          </div>
                        )}
                        {file.errorMessage && (
                          <p className="text-xs text-destructive">{file.errorMessage}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {file.status === "validated" && (
                        <Button size="sm" onClick={() => handlePublish(file)}>
                          Publish
                        </Button>
                      )}
                      {file.status === "publishing" && (
                        <Button size="sm" disabled>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing
                        </Button>
                      )}
                      {file.status === "error" && file.intakeId && (
                        <Button size="sm" variant="outline" onClick={() => handleRevalidate(file)}>
                          Re-run validation
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => removeFile(file.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
