import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { formatYouTubeUrl, getYouTubeThumbnail } from "@/utils/videoUtils";
import { useParams, useNavigate } from "react-router-dom";

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
import { PlusIcon, Trash2Icon, Loader2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const resourceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  url: z.string().url("Must be a valid URL"),
  type: z.enum(["Video", "PDF", "Article", "Link"]),
});

const tutorialSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  content: z.string().min(50, "Content must be at least 50 characters"),
  sportType: z.string().min(2, "Sport type is required"),
  skillLevel: z.enum(["Beginner", "Intermediate", "Advanced", "All Levels"]),
  videoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  thumbnailUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  duration: z.number().int().positive("Duration must be positive"),
  tags: z.array(z.string()),
  resources: z.array(resourceSchema),
});

type TutorialForm = z.infer<typeof tutorialSchema>;
type ResourceForm = z.infer<typeof resourceSchema>;

const sportTypeOptions = [
  "Football", "Basketball", "Tennis", "Swimming", "Volleyball", 
  "Baseball", "Badminton", "Cycling", "Golf", "Running", "Cricket", "Other"
];

const skillLevelOptions = ["Beginner", "Intermediate", "Advanced", "All Levels"];
const resourceTypeOptions = ["Video", "PDF", "Article", "Link"];

export default function EditTutorial() {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tag, setTag] = useState("");
  const [resource, setResource] = useState<ResourceForm>({
    title: "",
    url: "",
    type: "Video",
  });

  const form = useForm<TutorialForm>({
    resolver: zodResolver(tutorialSchema),
    defaultValues: {
      title: "",
      description: "",
      content: "",
      sportType: "",
      skillLevel: "Beginner",
      videoUrl: "",
      thumbnailUrl: "",
      duration: 0,
      tags: [],
      resources: [],
    },
  });

  // Fetch the tutorial data
  const { data: tutorial, isLoading } = useQuery({
    queryKey: ["tutorial", id],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/tutorials/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    },
    onSuccess: (data) => {
      // Set form values when data is loaded
      form.reset({
        title: data.title,
        description: data.description,
        content: data.content,
        sportType: data.sportType,
        skillLevel: data.skillLevel,
        videoUrl: data.videoUrl || "",
        thumbnailUrl: data.thumbnailUrl || "",
        duration: data.duration,
        tags: data.tags || [],
        resources: data.resources || [],
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to fetch tutorial");
      navigate("/admin");
    },
  });

  const updateTutorial = useMutation({
    mutationFn: async (data: TutorialForm) => {
      const token = localStorage.getItem("token");
      const response = await axios.put(`${API_URL}/tutorials/${id}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Tutorial updated successfully!");
      navigate(`/tutorials/${id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update tutorial");
    },
  });

  const onSubmit = (data: TutorialForm) => {
    const formData = { ...data };
    
    // Format YouTube URL if provided
    if (formData.videoUrl) {
      formData.videoUrl = formatYouTubeUrl(formData.videoUrl);
      
      // Auto-set thumbnail from YouTube if not provided
      if (!formData.thumbnailUrl) {
        const thumbnail = getYouTubeThumbnail(formData.videoUrl);
        if (thumbnail) {
          formData.thumbnailUrl = thumbnail;
        }
      }
    }
    
    // Format YouTube URLs in resources
    if (formData.resources?.length) {
      formData.resources = formData.resources.map(resource => {
        if (resource.type === 'Video' && resource.url) {
          return {
            ...resource,
            url: formatYouTubeUrl(resource.url)
          };
        }
        return resource;
      });
    }
    
    updateTutorial.mutate(formData);
  };

  const addTag = () => {
    if (tag && tag.trim() !== "" && !form.getValues("tags").includes(tag)) {
      form.setValue("tags", [...form.getValues("tags"), tag]);
      setTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    form.setValue(
      "tags",
      form.getValues("tags").filter((t) => t !== tagToRemove)
    );
  };

  const addResource = () => {
    if (resource.title && resource.url) {
      form.setValue("resources", [...form.getValues("resources"), { ...resource }]);
      setResource({ title: "", url: "", type: "Video" });
    }
  };

  const removeResource = (index: number) => {
    const resources = form.getValues("resources");
    form.setValue(
      "resources",
      resources.filter((_, i) => i !== index)
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading tutorial...</span>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tutorial Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter tutorial title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
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
              name="skillLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Skill Level</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select skill level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {skillLevelOptions.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  placeholder="A short description of the tutorial"
                  className="resize-none min-h-20"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="The main content of the tutorial"
                  className="resize-none min-h-40"
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
            name="videoUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Video URL (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Video URL" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="thumbnailUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Thumbnail URL (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Thumbnail URL" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duration (minutes)</FormLabel>
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

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Tags</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Add a tag"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
              />
              <Button type="button" onClick={addTag} size="icon">
                <PlusIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {form.getValues("tags").map((tagItem) => (
              <Card key={tagItem} className="py-1 px-3 inline-flex items-center space-x-1">
                <CardContent className="p-0 flex items-center">
                  <span>{tagItem}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 ml-1"
                    onClick={() => removeTag(tagItem)}
                  >
                    <Trash2Icon className="h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Resources</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Resource Title"
              value={resource.title}
              onChange={(e) => setResource({ ...resource, title: e.target.value })}
            />
            <Input
              placeholder="Resource URL"
              value={resource.url}
              onChange={(e) => setResource({ ...resource, url: e.target.value })}
            />
            <div className="flex space-x-2">
              <Select
                value={resource.type}
                onValueChange={(value) => setResource({ ...resource, type: value as any })}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Resource Type" />
                </SelectTrigger>
                <SelectContent>
                  {resourceTypeOptions.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" onClick={addResource} size="icon">
                <PlusIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {form.getValues("resources").map((res, index) => (
              <Card key={index} className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">{res.title}</h4>
                    <p className="text-sm text-muted-foreground">{res.type} - {res.url}</p>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => removeResource(index)}
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={updateTutorial.isPending}>
          {updateTutorial.isPending ? "Updating..." : "Update Tutorial"}
        </Button>
      </form>
    </Form>
  );
} 