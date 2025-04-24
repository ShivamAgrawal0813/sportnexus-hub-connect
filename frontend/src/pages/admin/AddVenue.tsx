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

const timeSlotSchema = z.object({
  day: z.string().min(1, "Day is required"),
  openTime: z.string().min(1, "Opening time is required"),
  closeTime: z.string().min(1, "Closing time is required"),
});

const venueSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  zipCode: z.string().min(5, "Zip code is required"),
  images: z.array(z.string().url("Must be a valid URL")).min(1, "At least one image URL is required"),
  sportTypes: z.array(z.string()).min(1, "At least one sport type is required"),
  amenities: z.array(z.string()),
  pricePerHour: z.number().positive("Price must be positive"),
  capacity: z.number().int().positive("Capacity must be positive"),
  availableTimeSlots: z.array(timeSlotSchema).min(1, "At least one time slot is required"),
  rules: z.array(z.string()),
  contactInfo: z.object({
    phone: z.string().min(10, "Valid phone number required"),
    email: z.string().email("Valid email required"),
    website: z.string().url("Must be a valid URL").optional(),
  }),
});

type VenueForm = z.infer<typeof venueSchema>;

const sportTypeOptions = [
  "Football", "Basketball", "Tennis", "Swimming", "Volleyball", 
  "Baseball", "Badminton", "Cycling", "Golf", "Running", "Cricket", "Other"
];

const dayOptions = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
];

export default function AddVenue() {
  const [imageUrl, setImageUrl] = useState("");
  const [sportType, setSportType] = useState("");
  const [amenity, setAmenity] = useState("");
  const [rule, setRule] = useState("");

  const form = useForm<VenueForm>({
    resolver: zodResolver(venueSchema),
    defaultValues: {
      name: "",
      description: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      images: [],
      sportTypes: [],
      amenities: [],
      pricePerHour: 0,
      capacity: 0,
      availableTimeSlots: [{ day: "Monday", openTime: "09:00", closeTime: "18:00" }],
      rules: [],
      contactInfo: {
        phone: "",
        email: "",
        website: "",
      },
    },
  });

  const createVenue = useMutation({
    mutationFn: async (data: VenueForm) => {
      const token = localStorage.getItem("token");
      const response = await axios.post(`${API_URL}/venues`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Venue created successfully!");
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create venue");
    },
  });

  const onSubmit = (data: VenueForm) => {
    createVenue.mutate(data);
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

  const addSportType = () => {
    if (sportType && !form.getValues("sportTypes").includes(sportType)) {
      form.setValue("sportTypes", [...form.getValues("sportTypes"), sportType]);
      setSportType("");
    }
  };

  const removeSportType = (type: string) => {
    form.setValue(
      "sportTypes",
      form.getValues("sportTypes").filter((t) => t !== type)
    );
  };

  const addAmenity = () => {
    if (amenity && amenity.trim() !== "") {
      form.setValue("amenities", [...form.getValues("amenities"), amenity]);
      setAmenity("");
    }
  };

  const removeAmenity = (index: number) => {
    const amenities = form.getValues("amenities");
    form.setValue(
      "amenities",
      amenities.filter((_, i) => i !== index)
    );
  };

  const addRule = () => {
    if (rule && rule.trim() !== "") {
      form.setValue("rules", [...form.getValues("rules"), rule]);
      setRule("");
    }
  };

  const removeRule = (index: number) => {
    const rules = form.getValues("rules");
    form.setValue(
      "rules",
      rules.filter((_, i) => i !== index)
    );
  };

  const addTimeSlot = () => {
    form.setValue("availableTimeSlots", [
      ...form.getValues("availableTimeSlots"),
      { day: "Monday", openTime: "09:00", closeTime: "18:00" },
    ]);
  };

  const removeTimeSlot = (index: number) => {
    const slots = form.getValues("availableTimeSlots");
    if (slots.length > 1) {
      form.setValue(
        "availableTimeSlots",
        slots.filter((_, i) => i !== index)
      );
    }
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
                <FormLabel>Venue Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter venue name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="pricePerHour"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price per Hour ($)</FormLabel>
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
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacity</FormLabel>
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
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the venue"
                  className="resize-none min-h-32"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input placeholder="Street address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="City" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <FormControl>
                    <Input placeholder="State" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="zipCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zip Code</FormLabel>
                  <FormControl>
                    <Input placeholder="Zip code" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="contactInfo.phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="Phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactInfo.email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Email address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactInfo.website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Website URL" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

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
          <h3 className="text-lg font-medium">Sport Types</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex space-x-2">
              <Select
                value={sportType}
                onValueChange={setSportType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sport type" />
                </SelectTrigger>
                <SelectContent>
                  {sportTypeOptions.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" onClick={addSportType} size="icon">
                <PlusIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {form.getValues("sportTypes").map((type) => (
              <Card key={type} className="py-1 px-3 inline-flex items-center space-x-1">
                <CardContent className="p-0 flex items-center">
                  <span>{type}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 ml-1"
                    onClick={() => removeSportType(type)}
                  >
                    <Trash2Icon className="h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          {form.formState.errors.sportTypes && (
            <p className="text-sm font-medium text-destructive">
              {form.formState.errors.sportTypes.message}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Amenities (Optional)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Amenity"
                value={amenity}
                onChange={(e) => setAmenity(e.target.value)}
              />
              <Button type="button" onClick={addAmenity} size="icon">
                <PlusIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {form.getValues("amenities").map((item, index) => (
              <Card key={index} className="py-1 px-3 inline-flex items-center space-x-1">
                <CardContent className="p-0 flex items-center">
                  <span>{item}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 ml-1"
                    onClick={() => removeAmenity(index)}
                  >
                    <Trash2Icon className="h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Rules (Optional)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Rule"
                value={rule}
                onChange={(e) => setRule(e.target.value)}
              />
              <Button type="button" onClick={addRule} size="icon">
                <PlusIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {form.getValues("rules").map((item, index) => (
              <Card key={index} className="py-1 px-3 inline-flex items-center space-x-1">
                <CardContent className="p-0 flex items-center">
                  <span>{item}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 ml-1"
                    onClick={() => removeRule(index)}
                  >
                    <Trash2Icon className="h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Available Time Slots</h3>
            <Button type="button" onClick={addTimeSlot} variant="outline" size="sm">
              Add Time Slot
            </Button>
          </div>

          {form.getValues("availableTimeSlots").map((_, index) => (
            <div key={index} className="grid grid-cols-3 items-center gap-4">
              <FormField
                control={form.control}
                name={`availableTimeSlots.${index}.day`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Day</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {dayOptions.map((day) => (
                          <SelectItem key={day} value={day}>
                            {day}
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
                name={`availableTimeSlots.${index}.openTime`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Open Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-end space-x-2">
                <FormField
                  control={form.control}
                  name={`availableTimeSlots.${index}.closeTime`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Close Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="mb-2"
                  onClick={() => removeTimeSlot(index)}
                  disabled={form.getValues("availableTimeSlots").length <= 1}
                >
                  <Trash2Icon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {form.formState.errors.availableTimeSlots && (
            <p className="text-sm font-medium text-destructive">
              At least one time slot is required
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={createVenue.isPending}>
          {createVenue.isPending ? "Creating..." : "Create Venue"}
        </Button>
      </form>
    </Form>
  );
} 