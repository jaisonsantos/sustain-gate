import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Leaf, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [email, setEmail] = useState("admin@demo.local");
  const [password, setPassword] = useState("admin123");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      if (email === "admin@demo.local" && password === "admin123") {
        toast({
          title: "Login successful",
          description: "Welcome to SSDR Platform",
        });
        navigate("/");
      } else {
        toast({
          title: "Login failed",
          description: "Invalid credentials",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Hero Section */}
        <div className="space-y-8 text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <Shield className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              SSDR
            </span>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
              Supplier Sustainability
              <span className="block text-primary">Data Router</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-lg">
              One-in, many-out ESG data management platform. Upload your sustainability data once, 
              export to multiple customer portals with full audit trails.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 pt-8">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center mx-auto">
                <Leaf className="w-6 h-6 text-success" />
              </div>
              <h3 className="font-semibold">ESG Compliant</h3>
              <p className="text-sm text-muted-foreground">ESRS & CDP ready</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-lg bg-info/10 flex items-center justify-center mx-auto">
                <Shield className="w-6 h-6 text-info" />
              </div>
              <h3 className="font-semibold">Audit Ready</h3>
              <p className="text-sm text-muted-foreground">Full traceability</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mx-auto">
                <Globe className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold">Multi-Portal</h3>
              <p className="text-sm text-muted-foreground">EcoVadis, CDP & more</p>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <Card className="w-full max-w-md mx-auto shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to your SSDR account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@demo.local"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
            
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Demo credentials: admin@demo.local / admin123
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}