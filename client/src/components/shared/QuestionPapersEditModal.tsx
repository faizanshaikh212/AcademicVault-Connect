import React from "react";
import { QuestionPaper } from "../../types/academic";
import { toast } from "react-hot-toast";
import ResourceEditModal from "./ResourceEditModal";

interface QuestionPapersEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  paper: QuestionPaper;
  onSubmit: (data: Partial<QuestionPaper>) => Promise<void>;
}

const QuestionPapersEditModal: React.FC<QuestionPapersEditModalProps> = ({
  isOpen,
  onClose,
  paper,
  onSubmit,
}) => {
  const handleSubmit = async (data: FormData | Partial<any>) => {
    try {
      // AcademicResourceForm will pass a plain object for edit mode.
      // Convert as-is to the expected QuestionPaper partial shape and forward.
      const payload = data instanceof FormData ? {} : (data as any);
      await onSubmit(payload as Partial<QuestionPaper>);
      onClose();
    } catch (error) {
      console.error("Error updating paper:", error);
      toast.error("Failed to update paper");
      throw error;
    }
  };

  const transformedInitial = {
    ...(paper as any),
    courseId: (paper as any).courseId || (paper as any).course || undefined,
    semesterId:
      (paper as any).semesterId || (paper as any).semester || undefined,
    subjectId: (paper as any).subjectId || (paper as any).subject || undefined,
    year: (paper as any).examYear
      ? String((paper as any).examYear)
      : (paper as any).year,
  };

  return (
    <ResourceEditModal
      isOpen={isOpen}
      onClose={onClose}
      resourceType="questionPapers"
      resource={paper as any}
      initialValues={transformedInitial}
      onSubmit={handleSubmit}
    />
  );
};

export default QuestionPapersEditModal;
