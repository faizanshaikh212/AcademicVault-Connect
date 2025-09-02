/**
 * Teacher Timetables Management Page
 */

import React from 'react';
import AcademicManagement from './AcademicManagement';
import { timetablesService } from '../../services/academicService';

const TeacherTimetablesManagement: React.FC = () => {
    // Wrapper functions to match the expected interface
    const wrappedService = {
        getAll: async (params?: any) => {
            const response = await timetablesService.getAllTimetables(params);
            return {
                data: response.data.map((item: any) => ({
                    ...item,
                    academicYear: item.academicYear || 'N/A',
                    tags: item.tags || []
                })),
                pagination: response.pagination
            };
        },
        upload: timetablesService.uploadTimetable,
        update: timetablesService.updateTimetable,
        delete: timetablesService.deleteTimetable,
        trackDownload: timetablesService.trackDownload,
    };

    return (
        <AcademicManagement
            resourceType="timetables"
            title="Class Timetables"
            service={wrappedService}
        />
    );
};

export default TeacherTimetablesManagement;