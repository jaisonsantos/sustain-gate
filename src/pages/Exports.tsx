import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Download, 
  FileText, 
  Package,
  Calendar,
  Share,
  Eye,
  MoreHorizontal,
  Filter,
  Search
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Export {
  id: string;
  title: string;
  customer: string;
  template: string;
  format: string;
  status: "queued" | "running" | "done" | "failed";
  createdAt: string;
  downloadCount: number;
  expiresAt?: string;
  size?: string;
}

const sampleExports: Export[] = [
  {
    id: "exp_1",
    title: "EcoVadis Assessment FY2025",
    customer: "Green Corp GmbH",
    template: "ecovadis_basic",
    format: "PDF + ZIP",
    status: "done",
    createdAt: "2025-09-20T10:30:00Z",
    downloadCount: 3,
    expiresAt: "2025-12-20T10:30:00Z",
    size: "2.4 MB"
  },
  {
    id: "exp_2",
    title: "CDP Climate Response",
    customer: "Sustainable Industries",
    template: "cdp_basic",
    format: "CSV + JSON",
    status: "running",
    createdAt: "2025-09-25T09:15:00Z",
    downloadCount: 0
  },
  {
    id: "exp_3",
    title: "Custom ESG Report Q4",
    customer: "ESG Partners Ltd",
    template: "custom_esg",
    format: "PDF",
    status: "done",
    createdAt: "2025-09-18T14:45:00Z",
    downloadCount: 1,
    expiresAt: "2025-11-18T14:45:00Z",
    size: "1.8 MB"
  },
  {
    id: "exp_4",
    title: "Supply Chain Assessment",
    customer: "Green Supply Chain",
    template: "supply_chain",
    format: "JSON",
    status: "failed",
    createdAt: "2025-09-24T16:20:00Z",
    downloadCount: 0
  }
];

const templates = [
  { id: "ecovadis_basic", name: "EcoVadis Basic", description: "Standard EcoVadis assessment format" },
  { id: "cdp_basic", name: "CDP Climate", description: "CDP Climate Change questionnaire" },
  { id: "custom_esg", name: "Custom ESG", description: "Customizable ESG report template" },
  { id: "supply_chain", name: "Supply Chain", description: "Supply chain sustainability report" }
];

export default function Exports() {
  const [exports, setExports] = useState<Export[]>(sampleExports);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "done": return "bg-success text-success-foreground";
      case "running": return "bg-info text-info-foreground";
      case "failed": return "bg-destructive text-destructive-foreground";
      case "queued": return "bg-warning text-warning-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "done": return "Ready";
      case "running": return "Generating";
      case "failed": return "Failed";
      case "queued": return "Queued";
      default: return status;
    }
  };

  const handleCreateExport = () => {
    toast({
      title: "Export queued",
      description: "Your export has been queued for generation",
    });
  };

  const handleDownload = (exportId: string) => {
    setExports(prev => prev.map(exp => 
      exp.id === exportId 
        ? { ...exp, downloadCount: exp.downloadCount + 1 }
        : exp
    ));
    
    toast({
      title: "Download started",
      description: "Your export file is being downloaded",
    });
  };

  const filteredExports = exports.filter(exp => {
    const matchesSearch = !searchQuery || 
      exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.customer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTemplate = !selectedTemplate || exp.template === selectedTemplate;
    return matchesSearch && matchesTemplate;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exports & Dossiers</h1>
          <p className="text-muted-foreground">
            Generate and manage sustainability data exports for your customers
          </p>
        </div>
        <Button onClick={handleCreateExport}>
          <Package className="w-4 h-4 mr-2" />
          Create Export
        </Button>
      </div>

      {/* Create Export Form */}
      <Card>
        <CardHeader>
          <CardTitle>Generate New Export</CardTitle>
          <CardDescription>
            Create a new sustainability data export for a customer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Template</label>
              <Select>
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
              <label className="text-sm font-medium">Customer</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="green_corp">Green Corp GmbH</SelectItem>
                  <SelectItem value="sustainable_ind">Sustainable Industries</SelectItem>
                  <SelectItem value="esg_partners">ESG Partners Ltd</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Period</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="q4_2024">Q4 2024</SelectItem>
                  <SelectItem value="fy_2024">FY 2024</SelectItem>
                  <SelectItem value="q1_2025">Q1 2025</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={handleCreateExport}>
              <Package className="w-4 h-4 mr-2" />
              Generate Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search exports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by template" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All templates</SelectItem>
            {templates.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Exports List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Exports</CardTitle>
              <CardDescription>
                Generated sustainability data exports and dossiers
              </CardDescription>
            </div>
            <Badge variant="outline">
              {filteredExports.length} exports
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredExports.map((exp) => (
              <div key={exp.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">{exp.title}</p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>{exp.customer}</span>
                      <span>•</span>
                      <span>{exp.format}</span>
                      <span>•</span>
                      <span>{formatDate(exp.createdAt)}</span>
                      {exp.size && (
                        <>
                          <span>•</span>
                          <span>{exp.size}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(exp.status)}>
                        {getStatusLabel(exp.status)}
                      </Badge>
                      {exp.downloadCount > 0 && (
                        <span className="text-xs text-muted-foreground">
                          Downloaded {exp.downloadCount} time(s)
                        </span>
                      )}
                      {exp.expiresAt && (
                        <span className="text-xs text-muted-foreground">
                          Expires: {formatDate(exp.expiresAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {exp.status === "done" && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownload(exp.id)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      <Button variant="outline" size="sm">
                        <Share className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                    </>
                  )}
                  
                  {exp.status === "failed" && (
                    <Button variant="outline" size="sm">
                      Retry
                    </Button>
                  )}
                  
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {filteredExports.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No exports found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || selectedTemplate
                    ? "No exports match your current filters"
                    : "You haven't created any exports yet"
                  }
                </p>
                <Button onClick={handleCreateExport}>
                  <Package className="w-4 h-4 mr-2" />
                  Create Your First Export
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}