import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { AdminNav } from "@/components/admin/AdminNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function AdminSettingsPage() {
  const [migrationResult, setMigrationResult] = useState<{
    success?: boolean;
    message?: string;
    data?: {
      venues: number;
      equipment: number;
    };
  } | null>(null);

  // Migration mutation
  const { mutate: runMigration, isPending: isMigrating } = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("token");
      
      if (!token) {
        throw new Error("Authentication required");
      }
      
      const response = await axios.post(
        `${API_URL}/admin/migrate-data`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      setMigrationResult(data);
      toast.success("Migration completed successfully");
    },
    onError: (error: any) => {
      console.error("Migration error:", error);
      setMigrationResult({
        success: false,
        message: error.response?.data?.message || error.message,
      });
      toast.error("Migration failed: " + (error.response?.data?.message || error.message));
    },
  });

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Admin Settings</h1>
      
      <AdminNav />
      
      <div className="grid grid-cols-1 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Data Migration</CardTitle>
            <CardDescription>
              Update existing venues and equipment with the current admin as creator
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              This will update all venues and equipment that don't have a creator assigned.
              The current admin user will be set as the creator for these items.
            </p>
            
            {migrationResult && (
              <Alert 
                variant={migrationResult.success ? "default" : "destructive"}
                className="mb-4"
              >
                {migrationResult.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle>
                  {migrationResult.success ? "Migration Successful" : "Migration Failed"}
                </AlertTitle>
                <AlertDescription>
                  {migrationResult.message || (
                    migrationResult.success 
                      ? `Updated ${migrationResult.data?.venues || 0} venues and ${migrationResult.data?.equipment || 0} equipment items.`
                      : "An unknown error occurred during migration."
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => runMigration()} 
              disabled={isMigrating}
            >
              {isMigrating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Run Migration
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 