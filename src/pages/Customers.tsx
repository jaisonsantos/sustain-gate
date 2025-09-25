import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  Building2,
  Globe,
  Mail,
  FileText,
  MoreHorizontal
} from "lucide-react";
import { useState } from "react";

interface Customer {
  id: string;
  name: string;
  country: string;
  email: string;
  activeRequests: number;
  totalExports: number;
  lastActivity: string;
  portals: string[];
  status: "active" | "inactive";
}

const sampleCustomers: Customer[] = [
  {
    id: "1",
    name: "Green Corp GmbH",
    country: "DE",
    email: "sustainability@greencorp.de",
    activeRequests: 2,
    totalExports: 12,
    lastActivity: "2025-09-24",
    portals: ["EcoVadis", "CDP"],
    status: "active"
  },
  {
    id: "2",
    name: "Sustainable Industries",
    country: "US",
    email: "esg@sustain.com",
    activeRequests: 1,
    totalExports: 8,
    lastActivity: "2025-09-20",
    portals: ["CDP", "Custom"],
    status: "active"
  },
  {
    id: "3",
    name: "ESG Partners Ltd",
    country: "GB",
    email: "data@esgpartners.co.uk",
    activeRequests: 0,
    totalExports: 15,
    lastActivity: "2025-08-15",
    portals: ["EcoVadis", "GRI", "Custom"],
    status: "inactive"
  },
  {
    id: "4",
    name: "Green Supply Chain",
    country: "FR",
    email: "procurement@greensc.fr",
    activeRequests: 3,
    totalExports: 6,
    lastActivity: "2025-09-25",
    portals: ["EcoVadis"],
    status: "active"
  }
];

export default function Customers() {
  const [customers] = useState<Customer[]>(sampleCustomers);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCountryFlag = (countryCode: string) => {
    const flags: Record<string, string> = {
      DE: "🇩🇪", US: "🇺🇸", GB: "🇬🇧", FR: "🇫🇷"
    };
    return flags[countryCode] || "🌍";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">
            Manage your customer relationships and data sharing agreements
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search customers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{customers.length}</p>
                <p className="text-sm text-muted-foreground">Total Customers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-success" />
              <div>
                <p className="text-2xl font-bold">
                  {customers.reduce((acc, c) => acc + c.activeRequests, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Active Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Globe className="w-5 h-5 text-info" />
              <div>
                <p className="text-2xl font-bold">
                  {customers.reduce((acc, c) => acc + c.totalExports, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Exports</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-accent" />
              <div>
                <p className="text-2xl font-bold">
                  {customers.filter(c => c.status === "active").length}
                </p>
                <p className="text-sm text-muted-foreground">Active Customers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customers Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredCustomers.map((customer) => (
          <Card key={customer.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span>{getCountryFlag(customer.country)}</span>
                    {customer.name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {customer.email}
                  </CardDescription>
                </div>
                <Badge variant={customer.status === "active" ? "default" : "secondary"}>
                  {customer.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Active Requests</p>
                  <p className="font-semibold text-info">{customer.activeRequests}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Exports</p>
                  <p className="font-semibold text-success">{customer.totalExports}</p>
                </div>
              </div>

              {/* Portals */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Portals Used</p>
                <div className="flex flex-wrap gap-1">
                  {customer.portals.map((portal) => (
                    <Badge key={portal} variant="outline" className="text-xs">
                      {portal}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Last Activity */}
              <div className="text-xs text-muted-foreground">
                Last activity: {customer.lastActivity}
              </div>

              {/* Actions */}
              <div className="flex justify-between pt-2">
                <Button variant="outline" size="sm">
                  View Details
                </Button>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No customers found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? "No customers match your search criteria"
                : "You haven't added any customers yet"
              }
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Customer
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}