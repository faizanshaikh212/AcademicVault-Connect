import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Trash2, Calendar, BookOpen, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import coursesService from '../../services/courses.service';

interface Subject {
    _id: string;
    title: string;
    description?: string;
    semester: string;
    creator: {
        _id: string;
        firstName: string;
        lastName: string;
    };
    createdAt: string;
}

interface Semester {
    _id: string;
    title: string;
    description?: string;
    course: string;
    creator: {
        _id: string;
        firstName: string;
        lastName: string;
    };
    createdAt: string;
    subjects?: Subject[];
}

interface CourseSemestersProps {
    course: any;
    onUpdate: () => void;
}

const CourseSemesters: React.FC<CourseSemestersProps> = ({ course, onUpdate }) => {
    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newSemesterTitle, setNewSemesterTitle] = useState('');

    // Subject management state
    const [expandedSemesters, setExpandedSemesters] = useState<Set<string>>(new Set());
    const [subjects, setSubjects] = useState<{ [semesterId: string]: Subject[] }>({});
    const [loadingSubjects, setLoadingSubjects] = useState<{ [semesterId: string]: boolean }>({});
    const [newSubjectTitle, setNewSubjectTitle] = useState<{ [semesterId: string]: string }>({});
    const [editingSubject, setEditingSubject] = useState<string | null>(null);
    const [editingSubjectTitle, setEditingSubjectTitle] = useState('');

    useEffect(() => {
        fetchSemesters();
    }, [course._id]);

    const fetchSemesters = async () => {
        try {
            setLoading(true);
            const response = await coursesService.listMySemestersForCourse(course._id);
            const semesterData = response.data || response || [];
            setSemesters(Array.isArray(semesterData) ? semesterData : []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load semesters');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSemester = async () => {
        if (!newSemesterTitle.trim()) return;

        try {
            await coursesService.createSemester({
                title: newSemesterTitle,
                course: course._id
            });

            setNewSemesterTitle('');
            fetchSemesters();
            onUpdate();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create semester');
        }
    };

    const handleDeleteSemester = async (semesterId: string) => {
        if (!confirm('Are you sure you want to delete this semester? This will also delete all subjects in it.')) {
            return;
        }

        try {
            await coursesService.deleteSemester(semesterId);
            fetchSemesters();
            onUpdate();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete semester');
        }
    };

    // Subject management functions
    const toggleSemesterExpansion = async (semesterId: string) => {
        const newExpanded = new Set(expandedSemesters);
        if (newExpanded.has(semesterId)) {
            newExpanded.delete(semesterId);
        } else {
            newExpanded.add(semesterId);
            // Fetch subjects when expanding
            await fetchSubjects(semesterId);
        }
        setExpandedSemesters(newExpanded);
    };

    const fetchSubjects = async (semesterId: string) => {
        try {
            setLoadingSubjects(prev => ({ ...prev, [semesterId]: true }));
            const response = await coursesService.listMySubjectsForSemester(semesterId);
            const subjectData = response.data || response || [];
            setSubjects(prev => ({
                ...prev,
                [semesterId]: Array.isArray(subjectData) ? subjectData : []
            }));
        } catch (err) {
            console.error('Failed to load subjects:', err);
            setSubjects(prev => ({ ...prev, [semesterId]: [] }));
        } finally {
            setLoadingSubjects(prev => ({ ...prev, [semesterId]: false }));
        }
    };

    const handleCreateSubject = async (semesterId: string) => {
        const title = newSubjectTitle[semesterId];
        if (!title?.trim()) return;

        try {
            await coursesService.createSubject({
                title: title.trim(),
                semester: semesterId,
                course: course._id
            });

            setNewSubjectTitle(prev => ({ ...prev, [semesterId]: '' }));
            await fetchSubjects(semesterId);
            onUpdate();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create subject');
        }
    };

    const handleDeleteSubject = async (subjectId: string, semesterId: string) => {
        if (!confirm('Are you sure you want to delete this subject?')) {
            return;
        }

        try {
            await coursesService.deleteSubject(subjectId);
            await fetchSubjects(semesterId);
            onUpdate();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete subject');
        }
    };

    const startEditSubject = (subject: Subject) => {
        setEditingSubject(subject._id);
        setEditingSubjectTitle(subject.title);
    };

    const saveSubjectEdit = async (subjectId: string, semesterId: string) => {
        if (!editingSubjectTitle.trim()) return;

        try {
            await coursesService.updateSubject(subjectId, {
                title: editingSubjectTitle.trim()
            });
            setEditingSubject(null);
            setEditingSubjectTitle('');
            await fetchSubjects(semesterId);
            onUpdate();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update subject');
        }
    };

    const cancelSubjectEdit = () => {
        setEditingSubject(null);
        setEditingSubjectTitle('');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="text-gray-500 dark:text-gray-400">Loading semesters...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="text-red-700 dark:text-red-300 font-medium">Error</div>
                <div className="text-red-600 dark:text-red-400 text-sm mt-1">{error}</div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchSemesters}
                    className="mt-2"
                >
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Course Structure
                </h4>
            </div>

            {/* New Semester Form */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-3">Add New Semester</h5>
                <div className="flex gap-3">
                    <Input
                        placeholder="Semester title (e.g., Semester 1)"
                        value={newSemesterTitle}
                        onChange={(e) => setNewSemesterTitle(e.target.value)}
                        className="flex-1"
                    />
                    <Button size="sm" onClick={handleCreateSemester} disabled={!newSemesterTitle.trim()}>
                        Create Semester
                    </Button>
                </div>
            </div>

            {/* Semesters List */}
            {semesters.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No semesters created yet</p>
                    <p className="text-sm mt-1">Add a semester to get started</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {semesters.map((semester) => (
                        <div
                            key={semester._id}
                            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                        >
                            {/* Semester Header */}
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleSemesterExpansion(semester._id)}
                                            className="p-1 h-auto"
                                        >
                                            {expandedSemesters.has(semester._id) ? (
                                                <ChevronDown className="h-4 w-4" />
                                            ) : (
                                                <ChevronRight className="h-4 w-4" />
                                            )}
                                        </Button>
                                        <div>
                                            <h5 className="font-medium text-gray-900 dark:text-white">
                                                {semester.title}
                                            </h5>
                                            {semester.description && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                    {semester.description}
                                                </p>
                                            )}
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                {subjects[semester._id]?.length || 0} subjects
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDeleteSemester(semester._id)}
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>

                            {/* Subjects Section */}
                            {expandedSemesters.has(semester._id) && (
                                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                                    {/* Add Subject Form */}
                                    <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                        <h6 className="font-medium text-green-900 dark:text-green-100 mb-2">Add Subject</h6>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Subject title (e.g., Mathematics)"
                                                value={newSubjectTitle[semester._id] || ''}
                                                onChange={(e) => setNewSubjectTitle(prev => ({
                                                    ...prev,
                                                    [semester._id]: e.target.value
                                                }))}
                                                className="flex-1"
                                            />
                                            <Button
                                                size="sm"
                                                onClick={() => handleCreateSubject(semester._id)}
                                                disabled={!newSubjectTitle[semester._id]?.trim()}
                                                className="bg-green-600 hover:bg-green-700"
                                            >
                                                <Plus className="h-3 w-3 mr-1" />
                                                Add
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Subjects List */}
                                    {loadingSubjects[semester._id] ? (
                                        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                                            Loading subjects...
                                        </div>
                                    ) : subjects[semester._id]?.length === 0 ? (
                                        <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                                            <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">No subjects added yet</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {subjects[semester._id]?.map((subject) => (
                                                <div
                                                    key={subject._id}
                                                    className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                                                >
                                                    <div className="flex-1">
                                                        {editingSubject === subject._id ? (
                                                            <Input
                                                                value={editingSubjectTitle}
                                                                onChange={(e) => setEditingSubjectTitle(e.target.value)}
                                                                className="text-sm"
                                                            />
                                                        ) : (
                                                            <div>
                                                                <div className="font-medium text-gray-900 dark:text-white text-sm">
                                                                    {subject.title}
                                                                </div>
                                                                {subject.description && (
                                                                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                                        {subject.description}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1 ml-3">
                                                        {editingSubject === subject._id ? (
                                                            <>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => saveSubjectEdit(subject._id, semester._id)}
                                                                    className="h-7 px-2 text-xs bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
                                                                >
                                                                    Save
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={cancelSubjectEdit}
                                                                    className="h-7 px-2 text-xs"
                                                                >
                                                                    Cancel
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => startEditSubject(subject)}
                                                                    className="h-7 px-2 text-xs"
                                                                >
                                                                    Edit
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleDeleteSubject(subject._id, semester._id)}
                                                                    className="h-7 px-2 text-xs text-red-600 hover:text-red-700"
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CourseSemesters;