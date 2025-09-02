import React from "react";
import BaseEditModal from "./BaseEditModal";
import AcademicResourceForm from "./AcademicResourceForm";
import { QuestionPaper } from "../../types/academic";
import { questionPapersService } from "../../services/academicService";

interface FileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  paper: QuestionPaper;
  onUpdate: () => void;
}

const FileEditModal: React.FC<FileEditModalProps> = ({
  isOpen,
  onClose,
  paper,
  onUpdate,
}) => {
  const handleSubmit = async (data: FormData | Partial<any>) => {
    try {
      const payload = data instanceof FormData ? {} : (data as any);
      await questionPapersService.updateQuestionPaper(paper._id, payload);
      onUpdate();
      onClose();
    } catch (error) {
      console.error("Error updating paper:", error);
      throw error;
    }
  };

  return (
    <BaseEditModal isOpen={isOpen} onClose={onClose} title="Edit Paper Details">
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

export default FileEditModal;
