import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Switch } from "@/components/ui/Switch";
import { Upload, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/useToast.tsx";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/Form";
import { Input } from "@/components/ui/Input";

interface FormValues {
  title: string;
  description: string;
  target: {
    course: string;
    allSemesters: boolean;
    semesters: number[];
  };
  dueDate: string;
  points: number;
  lateSubmissionAppealEmail: string;
  fileLink?: string;
}

interface AssignmentFormProps {
  onSubmit: (data: FormValues) => Promise<void>;
  courses: Array<{ value: string; label: string; semesters: number }>;
  isLoading?: boolean;
  initialData?: Partial<FormValues>;
}

const assignmentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  target: z.object({
    course: z.string().min(1, "Course is required"),
    allSemesters: z.boolean(),
    semesters: z.array(z.number()),
  }),
  dueDate: z.string().min(1, "Due date is required"),
  points: z.number().min(0, "Points must be positive"),
  lateSubmissionAppealEmail: z.string().email("Invalid email format"),
  fileLink: z.string().url("Must be a valid URL").optional(),
});

export const AssignmentForm: React.FC<AssignmentFormProps> = ({
  onSubmit,
  courses,
  isLoading,
  initialData,
}) => {
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      target: initialData?.target || {
        course: "",
        allSemesters: false,
        semesters: [],
      },
      dueDate: initialData?.dueDate || "",
      points: initialData?.points || 0,
      lateSubmissionAppealEmail: initialData?.lateSubmissionAppealEmail || "",
    },
  });

  const handleSubmit = async (values: FormValues) => {
    await onSubmit(values);
  };

  const selectedCourse = courses.find(
    (c) => c.value === form.watch("target.course")
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter assignment title..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Write assignment description..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="target.course"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Course</FormLabel>
              <FormControl>
                <Select
                  options={courses}
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
                      checked={field.value || false}
                      onCheckedChange={(checked) => {
                        console.log("Switch toggled:", checked);
                        form.setValue("target.allSemesters", checked, {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        });

                        // When toggling all semesters, update the semesters array
                        if (checked && selectedCourse) {
                          const allSemesters = Array.from(
                            { length: selectedCourse.semesters },
                            (_, i) => i + 1
                          );
                          console.log("Setting all semesters:", allSemesters);
                          form.setValue("target.semesters", allSemesters, {
                            shouldDirty: true,
                            shouldTouch: true,
                            shouldValidate: true,
                          });
                        } else {
                          console.log("Clearing semesters");
                          form.setValue("target.semesters", [], {
                            shouldDirty: true,
                            shouldTouch: true,
                            shouldValidate: true,
                          });
                        }
                      }}
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
                        { length: selectedCourse.semesters },
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
                            const newSemesters = currentSemesters.includes(
                              semester
                            )
                              ? currentSemesters.filter((s) => s !== semester)
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

        <FormField
          control={form.control}
          name="dueDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Due Date</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="points"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Points</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  {...field}
                  onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="lateSubmissionAppealEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Late Submission Appeal Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="Enter your email..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fileLink"
          render={({ field }) => (
            <FormItem>
              <FormLabel>File Link (URL)</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="Paste a link to the assignment file (Google Drive, Dropbox, etc.)"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline">
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Create Assignment"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
