import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import axios from "axios";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { PlusIcon, Trash2Icon } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const equipmentSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(2, "Category is required"),
  brand: z.string().min(2, "Brand is required"),
  model: z.string().min(2, "Model is required"),
  images: z.array(z.string().url("Must be a valid URL")).min(1, "At least one image URL is required"),
  sportType: z.string().min(2, "Sport type is required"),
  condition: z.enum(["New", "Like New", "Good", "Fair", "Poor"]),
  purchasePrice: z.number().positive("Price must be positive"),
  rentalPriceDaily: z.number().positive("Rental price must be positive"),
  availability: z.enum(["In Stock", "Low Stock", "Out of Stock", "Discontinued"]).default("In Stock"),
  quantity: z.number().int().min(0, "Quantity cannot be negative"),
  features: z.array(z.string()),
  warranty: z.string().optional(),
});

type EquipmentForm = z.infer<typeof equipmentSchema>;

const sportTypeOptions = [
  "Football", "Basketball", "Tennis", "Swimming", "Volleyball", 
  "Baseball", "Badminton", "Cycling", "Golf", "Running", "Cricket", "Other"
];

const conditionOptions = ["New", "Like New", "Good", "Fair", "Poor"];
const availabilityOptions = ["In Stock", "Low Stock", "Out of Stock", "Discontinued"];

export default function AddEquipment() {
  const [imageUrl, setImageUrl] = useState("");
  const [feature, setFeature] = useState("");

  const form = useForm<EquipmentForm>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      brand: "",
      model: "",
      images: [],
      sportType: "",
      condition: "New",
      purchasePrice: 0,
      rentalPriceDaily: 0,
      availability: "In Stock",
      quantity: 0,
      features: [],
      warranty: "",
    },
  });

  const createEquipment = useMutation({
    mutationFn: async (data: EquipmentForm) => {
      const token = localStorage.getItem("token");
      const response = await axios.post(`${API_URL}/equipment`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Equipment created successfully!");
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create equipment");
    },
  });

  const onSubmit = (data: EquipmentForm) => {
    createEquipment.mutate(data);
  };

  const addImage = () => {
    if (imageUrl && imageUrl.trim() !== "") {
      form.setValue("images", [...form.getValues("images"), imageUrl]);
      setImageUrl("");
    }
  };

  const removeImage = (index: number) => {
    const images = form.getValues("images");
    form.setValue(
      "images",
      images.filter((_, i) => i !== index)
    );
  };

  const addFeature = () => {
    if (feature && feature.trim() !== "") {
      form.setValue("features", [...form.getValues("features"), feature]);
      setFeature("");
    }
  };

  const removeFeature = (index: number) => {
    const features = form.getValues("features");
    form.setValue(
      "features",
      features.filter((_, i) => i !== index)
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Equipment Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter equipment name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="purchasePrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purchase Price ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rentalPriceDaily"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Daily Rental Price ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the equipment"
                  className="resize-none min-h-32"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Input placeholder="Category" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="brand"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Brand</FormLabel>
                <FormControl>
                  <Input placeholder="Brand" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Model</FormLabel>
                <FormControl>
                  <Input placeholder="Model" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="sportType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sport Type</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sport type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {sportTypeOptions.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="condition"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Condition</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {conditionOptions.map((condition) => (
                      <SelectItem key={condition} value={condition}>
                        {condition}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="availability"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Availability</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select availability" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availabilityOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="warranty"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Warranty (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Warranty information" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Images</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Image URL"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
              <Button type="button" onClick={addImage} size="icon">
                <PlusIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {form.getValues("images").map((url, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input value={url} readOnly />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => removeImage(index)}
                >
                  <Trash2Icon className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          {form.formState.errors.images && (
            <p className="text-sm font-medium text-destructive">
              {form.formState.errors.images.message}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Features (Optional)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Feature"
                value={feature}
                onChange={(e) => setFeature(e.target.value)}
              />
              <Button type="button" onClick={addFeature} size="icon">
                <PlusIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {form.getValues("features").map((item, index) => (
              <Card key={index} className="py-1 px-3 inline-flex items-center space-x-1">
                <CardContent className="p-0 flex items-center">
                  <span>{item}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 ml-1"
                    onClick={() => removeFeature(index)}
                  >
                    <Trash2Icon className="h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={createEquipment.isPending}>
          {createEquipment.isPending ? "Creating..." : "Create Equipment"}
        </Button>
      </form>
    </Form>
  );
} 