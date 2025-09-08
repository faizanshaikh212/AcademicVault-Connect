/**
 * Teacher Syllabus Management Page
 */

import React from 'react';
import AcademicManagement from './AcademicManagement';
import { syllabusService } from '../../services/academicService';

const TeacherSyllabusManagement: React.FC = () => {
    // Wrapper functions to match the expected interface
    const wrappedService = {
        getAll: async (params?: any) => {
            const response = await syllabusService.getAllSyllabus(params);
            return {
                data: response.data.map((item: any) => ({
                    ...item,
                    academicYear: item.academicYear || 'N/A',
                    tags: item.tags || []
                })),
                pagination: response.pagination
            };
        },
        upload: syllabusService.uploadSyllabus,
        update: syllabusService.updateSyllabus,
        delete: syllabusService.deleteSyllabus,
        trackDownload: syllabusService.trackDownload,
    };

    return (
        <AcademicManagement
            resourceType="syllabus"
            title="Course Syllabus"
            service={wrappedService}
        />
    );
};

export default TeacherSyllabusManagement;