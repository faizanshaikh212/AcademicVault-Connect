/**
 * Teacher Question Papers Management Page
 */

import React from 'react';
import AcademicManagement from './AcademicManagement';
import { questionPapersService } from '../../services/academicService';

const TeacherQuestionPapersManagement: React.FC = () => {
    // Wrapper functions to match the expected interface
    const wrappedService = {
        getAll: async (params?: any) => {
            const response = await questionPapersService.getAllQuestionPapers(params);
            return {
                data: response.data.map((item: any) => ({
                    ...item,
                    academicYear: item.academicYear || 'N/A',
                    tags: item.tags || []
                })),
                pagination: response.pagination
            };
        },
        upload: questionPapersService.uploadQuestionPaper,
        update: questionPapersService.updateQuestionPaper,
        delete: questionPapersService.deleteQuestionPaper,
        trackDownload: questionPapersService.trackDownload,
    };

    return (
        <AcademicManagement
            resourceType="questionPapers"
            title="Question Papers"
            service={wrappedService}
        />
    );
};

export default TeacherQuestionPapersManagement;