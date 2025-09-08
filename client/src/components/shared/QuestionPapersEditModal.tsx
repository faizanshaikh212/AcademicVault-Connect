import React from "react";
import { QuestionPaper } from "../../types/academic";
import { toast } from "react-hot-toast";
import BaseEditModal from "./BaseEditModal";
import AcademicResourceForm from "./AcademicResourceForm";

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

  return (
    <BaseEditModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Question Paper"
      description="Update the question paper information below."
    >
      <AcademicResourceForm
        initialValues={paper as any}
        resourceType="questionPapers"
        createMode={false}
        onCancel={onClose}
        onSubmit={handleSubmit}
        submitLabel="Save Changes"
      />
    </BaseEditModal>
  );
};

export default QuestionPapersEditModal;
