import React from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
    Edit3,
    Trash2,
    ChevronDown,
    ChevronRight,
    User,
    Calendar,
    BookOpen
} from "lucide-react";

interface CourseCardProps {
    course: any;
    editingCourse: string | null;
    editingTitle: string;
    editingDescription: string;
    editingCategory: string;
    expandedCourse: string | null;
    onStartEdit: (course: any) => void;
    onSaveEdit: (courseId: string) => void;
    onCancelEdit: () => void;
    onDelete: (courseId: string) => void;
    onToggleExpand: (courseId: string) => void;
    onTitleChange: (title: string) => void;
    onDescriptionChange: (description: string) => void;
    onCategoryChange: (category: string) => void;
    onUpdate: () => void;
}

const CourseCard: React.FC<CourseCardProps> = ({
    course,
    editingCourse,
    editingTitle,
    editingDescription,
    editingCategory,
    expandedCourse,
    onStartEdit,
    onSaveEdit,
    onCancelEdit,
    onDelete,
    onToggleExpand,
    onTitleChange,
    onDescriptionChange,
    onCategoryChange
}) => {
    const isEditing = editingCourse === course._id;
    const isExpanded = expandedCourse === course._id;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        {isEditing ? (
                            <div className="space-y-4">
                                <Input
                                    value={editingTitle}
                                    onChange={(e) => onTitleChange(e.target.value)}
                                    className="text-lg font-semibold"
                                />
                                <textarea
                                    value={editingDescription}
                                    onChange={(e) => onDescriptionChange(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    rows={2}
                                    placeholder="Course description..."
                                />
                                <select
                                    value={editingCategory}
                                    onChange={(e) => onCategoryChange(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="">Select Category</option>
                                    <option value="BE">BE</option>
                                    <option value="BSC">BSC</option>
                                    <option value="Commerce">Commerce</option>
                                    <option value="PG">PG</option>
                                </select>
                            </div>
                        ) : (
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                    {course.title}
                                </h3>
                                {course.description && (
                                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                                        {course.description}
                                    </p>
                                )}
                                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                    <div className="flex items-center gap-1">
                                        <User className="h-4 w-4" />
                                        <span>
                                            Created by {course.creator?.firstName} {course.creator?.lastName}
                                        </span>
                                    </div>
                                    {course.type && (
                                        <div className="flex items-center gap-1">
                                            <BookOpen className="h-4 w-4" />
                                            <span>{course.type}</span>
                                        </div>
                                    )}
                                    {course.semesterCount && (
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-4 w-4" />
                                            <span>{course.semesterCount} semesters</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                        {isEditing ? (
                            <>
                                <Button
                                    size="sm"
                                    onClick={() => onSaveEdit(course._id)}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    Save
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onCancelEdit}
                                >
                                    Cancel
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onToggleExpand(course._id)}
                                    className="flex items-center gap-1"
                                >
                                    {isExpanded ? (
                                        <>
                                            <ChevronDown className="h-4 w-4" />
                                            Hide
                                        </>
                                    ) : (
                                        <>
                                            <ChevronRight className="h-4 w-4" />
                                            Manage
                                        </>
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onStartEdit(course)}
                                    className="flex items-center gap-1"
                                >
                                    <Edit3 className="h-4 w-4" />
                                    Edit
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onDelete(course._id)}
                                    className="flex items-center gap-1 text-red-600 hover:text-red-700"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseCard;