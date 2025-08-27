import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/Form";
import Select from "@/components/ui/Select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/useToast.tsx";
import { Loader2, Upload, XCircle, Image as ImageIcon } from "lucide-react";
import { getHumanFileSize } from "@/lib/googleDrive";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Switch } from "@/components/ui/Switch";
import { useEffect } from "react";
import courseService from "@/services/course.service";
import { Textarea } from "@/components/ui/Textarea";

// Form schema
const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  tags: z.array(z.string()),
  target: z.object({
    course: z.string().min(1, "Course is required"),
    allSemesters: z.boolean(),
    semesters: z.array(z.number()).optional(),
  }),
});

type FormData = z.infer<typeof formSchema>;

interface NoticeFormProps {
  onSubmit: (
    data: FormData & { coverImage?: File; attachments: File[] }
  ) => Promise<void>;
  isSubmitting?: boolean;
}

export const NoticeForm: React.FC<NoticeFormProps> = ({
  onSubmit,
  isSubmitting = false,
}) => {
  const [courses, setCourses] = useState<any[]>([]);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string>("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [tagInput, setTagInput] = useState("");
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      tags: [],
      target: {
        course: "",
        allSemesters: false,
        semesters: [],
      },
    },
  });

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const teacherCourses = await courseService.getAllCourses();
        setCourses(teacherCourses || []);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load courses",
          variant: "destructive",
        });
      }
    };
    loadCourses();
  }, [toast]);

  const handleCoverImageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Cover image must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAttachmentChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files || []);
    const totalSize = files.reduce((acc, file) => acc + file.size, 0);

    if (attachments.length + files.length > 10) {
      toast({
        title: "Error",
        description: "Maximum 10 attachments allowed",
        variant: "destructive",
      });
      return;
    }

    if (totalSize > 50 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Total attachment size must be less than 50MB",
        variant: "destructive",
      });
      return;
    }

    setAttachments((prev) => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTagInputKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      const newTag = tagInput.trim();
      if (newTag && !form.getValues().tags.includes(newTag)) {
        form.setValue("tags", [...form.getValues().tags, newTag]);
        setTagInput("");
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    form.setValue(
      "tags",
      form.getValues().tags.filter((tag) => tag !== tagToRemove)
    );
  };

  const handleSubmit = async (data: FormData) => {
    await onSubmit({
      ...data,
      coverImage: coverImage || undefined,
      attachments,
    });
  };

  const selectedCourse = courses.find(
    (course) => course._id === form.watch("target.course")
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Create Notice</CardTitle>
            <CardDescription>
              Create a new notice for your students with rich content and
              attachments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter notice title..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Cover Image */}
            <div className="space-y-2">
              <FormLabel>Cover Image (Optional)</FormLabel>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("coverImage")?.click()}
                  className="flex items-center gap-2"
                >
                  <ImageIcon className="h-4 w-4" />
                  {coverImage ? "Change Image" : "Add Cover Image"}
                </Button>
                <input
                  type="file"
                  id="coverImage"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCoverImageChange}
                />
              </div>
              {coverImagePreview && (
                <div className="relative w-full max-w-md">
                  <img
                    src={coverImagePreview}
                    alt="Cover preview"
                    className="rounded-md"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setCoverImage(null);
                      setCoverImagePreview("");
                    }}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Write your notice content here..."
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tags */}
            <div className="space-y-2">
              <FormLabel>Tags</FormLabel>
              <div className="flex flex-wrap gap-2 mb-2">
                {form.watch("tags").map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
              <Input
                placeholder="Add tags (press Enter or comma to add)..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
              />
            </div>

            {/* Attachments */}
            <div className="space-y-2">
              <FormLabel>Attachments (Max 10 files, 50MB total)</FormLabel>
              <div className="flex flex-col gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    document.getElementById("attachments")?.click()
                  }
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Add Files
                </Button>
                <input
                  type="file"
                  id="attachments"
                  multiple
                  className="hidden"
                  onChange={handleAttachmentChange}
                />
                {attachments.length > 0 && (
                  <div className="grid gap-2">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded-md"
                      >
                        <div className="flex items-center gap-2">
                          <div className="text-sm truncate">{file.name}</div>
                          <div className="text-xs text-gray-500">
                            ({getHumanFileSize(file.size)})
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeAttachment(index)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Target Audience */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="target.course"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Course</FormLabel>
                    <FormControl>
                      <Select
                        options={courses.map((c) => ({
                          value: c._id,
                          label: `${c.name} (${c.batch})`,
                        }))}
                        placeholder="Select a course"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedCourse && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="target.allSemesters"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <FormLabel>All Semesters</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) => field.onChange(e.target.checked)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {!form.watch("target.allSemesters") && (
                    <FormField
                      control={form.control}
                      name="target.semesters"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Semesters</FormLabel>
                          <div className="flex flex-wrap gap-2">
                            {Array.from(
                              { length: selectedCourse.totalSemesters },
                              (_, i) => i + 1
                            ).map((semester) => (
                              <Badge
                                key={semester}
                                variant={
                                  field.value?.includes(semester)
                                    ? "default"
                                    : "outline"
                                }
                                className={cn(
                                  "cursor-pointer",
                                  field.value?.includes(semester) &&
                                    "bg-blue-500 hover:bg-blue-600"
                                )}
                                onClick={() => {
                                  const currentSemesters = field.value || [];
                                  const newSemesters =
                                    currentSemesters.includes(semester)
                                      ? currentSemesters.filter(
                                          (s) => s !== semester
                                        )
                                      : [...currentSemesters, semester];
                                  field.onChange(newSemesters);
                                }}
                              >
                                Semester {semester}
                              </Badge>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full sm:w-auto"
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isSubmitting ? "Creating Notice..." : "Create Notice"}
            </Button>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
};
