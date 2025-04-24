import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminNav } from "@/components/admin/AdminNav";
import AddVenue from "./AddVenue";
import AddEquipment from "./AddEquipment";
import AddTutorial from "./AddTutorial";

export default function AdminDashboard() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <AdminNav />

      <Tabs defaultValue="venues" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="venues">Venues</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="tutorials">Tutorials</TabsTrigger>
        </TabsList>

        <TabsContent value="venues">
          <Card>
            <CardHeader>
              <CardTitle>Add New Venue</CardTitle>
              <CardDescription>
                Create a new sports venue for users to book
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AddVenue />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipment">
          <Card>
            <CardHeader>
              <CardTitle>Add New Equipment</CardTitle>
              <CardDescription>
                Add new sports equipment for rental or sale
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AddEquipment />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tutorials">
          <Card>
            <CardHeader>
              <CardTitle>Add New Tutorial</CardTitle>
              <CardDescription>
                Create a new sports tutorial with video content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AddTutorial />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 