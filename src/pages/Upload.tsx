import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Upload as UploadIcon, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  X,
  Download,
  Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: "uploading" | "parsing" | "validating" | "validated" | "error";
  errors?: string[];
  warnings?: string[];
  dataPoints?: number;
}

const sampleDataPoints = [
  { key: "energy.electricity_kwh", value: "120000", unit: "kWh", status: "valid" },
  { key: "water.m3_total", value: "1400", unit: "m³", status: "valid" },
  { key: "waste.total_kg", value: "2100", unit: "kg", status: "warning" },
  { key: "energy.renewable_pct", value: "28", unit: "%", status: "valid" },
  { key: "freight.ton_km_road", value: "7500", unit: "ton·km", status: "error" }
];

export default function Upload() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      handleFiles(selectedFiles);
    }
  }, []);

  const handleFiles = (fileList: File[]) => {
    const newFiles: UploadedFile[] = fileList.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      status: "uploading"
    }));

    setFiles(prev => [...prev, ...newFiles]);

    // Simulate upload and processing
    newFiles.forEach(file => {
      setTimeout(() => {
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: "parsing" } : f
        ));
      }, 1000);

      setTimeout(() => {
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: "validating" } : f
        ));
      }, 2000);

      setTimeout(() => {
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { 
            ...f, 
            status: "validated",
            dataPoints: 15,
            warnings: ["Unit conversion applied for waste data"],
            errors: []
          } : f
        ));
        
        toast({
          title: "Upload completed",
          description: `${file.name} has been processed successfully`,
        });
      }, 3000);
    });
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "validated": return "text-success";
      case "error": return "text-destructive";
      case "validating": return "text-warning";
      case "parsing": return "text-info";
      default: return "text-muted-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "uploading": return "Uploading...";
      case "parsing": return "Parsing...";
      case "validating": return "Validating...";
      case "validated": return "Ready";
      case "error": return "Error";
      default: return status;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload ESG Data</h1>
        <p className="text-muted-foreground">
          Upload your sustainability data files (CSV, XLSX) for processing
        </p>
      </div>

      {/* Upload Area */}
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
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <UploadIcon className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Upload your ESG data files</h3>
              <p className="text-muted-foreground">
                Drag and drop your CSV or XLSX files here, or click to browse
              </p>
            </div>
            <div className="flex gap-4">
              <label htmlFor="file-upload">
                <Button variant="default" className="cursor-pointer">
                  <UploadIcon className="w-4 h-4 mr-2" />
                  Choose Files
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
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              Supported formats: CSV, XLSX, XLS (Max 10MB per file)
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Files</CardTitle>
            <CardDescription>
              Files being processed and their validation status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <FileText className="w-8 h-8 text-muted-foreground" />
                    <div className="space-y-1">
                      <p className="font-medium">{file.name}</p>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>{formatFileSize(file.size)}</span>
                        <Badge variant="outline" className={getStatusColor(file.status)}>
                          {getStatusLabel(file.status)}
                        </Badge>
                        {file.dataPoints && (
                          <span>{file.dataPoints} data points</span>
                        )}
                      </div>
                      {file.warnings && file.warnings.length > 0 && (
                        <div className="flex items-center space-x-1 text-xs text-warning">
                          <AlertTriangle className="w-3 h-3" />
                          {file.warnings.length} warning(s)
                        </div>
                      )}
                      {file.errors && file.errors.length > 0 && (
                        <div className="flex items-center space-x-1 text-xs text-destructive">
                          <X className="w-3 h-3" />
                          {file.errors.length} error(s)
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {file.status === "validated" && (
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Preview */}
      {files.some(f => f.status === "validated") && (
        <Card>
          <CardHeader>
            <CardTitle>Data Preview</CardTitle>
            <CardDescription>
              Parsed and normalized sustainability data points
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sampleDataPoints.map((point, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">{point.key}</p>
                    <p className="text-sm text-muted-foreground">
                      {point.value} {point.unit}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {point.status === "valid" && (
                      <CheckCircle className="w-4 h-4 text-success" />
                    )}
                    {point.status === "warning" && (
                      <AlertTriangle className="w-4 h-4 text-warning" />
                    )}
                    {point.status === "error" && (
                      <X className="w-4 h-4 text-destructive" />
                    )}
                    <Badge 
                      variant="outline" 
                      className={cn(
                        point.status === "valid" && "text-success",
                        point.status === "warning" && "text-warning",
                        point.status === "error" && "text-destructive"
                      )}
                    >
                      {point.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline">
                Edit Mappings
              </Button>
              <Button>
                Publish Data
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}