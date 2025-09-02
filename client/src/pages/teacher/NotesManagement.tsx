/**
 * Teacher Notes Management Page
 */

import React from 'react';
import AcademicManagement from './AcademicManagement';
import { notesService } from '../../services/academicService';

const TeacherNotesManagement: React.FC = () => {
    // Wrapper functions to match the expected interface
    const wrappedService = {
        getAll: async (params?: any) => {
            const response = await notesService.getAllNotes(params);
            return {
                data: response.data.map((item: any) => ({
                    ...item,
                    academicYear: item.academicYear || 'N/A',
                    tags: item.tags || []
                })),
                pagination: response.pagination
            };
        },
        upload: notesService.uploadNote,
        update: notesService.updateNote,
        delete: notesService.deleteNote,
        trackDownload: notesService.trackDownload,
    };

    return (
        <AcademicManagement
            resourceType="notes"
            title="Academic Notes"
            service={wrappedService}
        />
    );
};

export default TeacherNotesManagement;