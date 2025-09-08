import React from "react";
import ResourceEditModal from "./ResourceEditModal";
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
    <ResourceEditModal
      isOpen={isOpen}
      onClose={onClose}
      resourceType="questionPapers"
      resource={paper as any}
      initialValues={paper}
      onSubmit={handleSubmit}
    />
  );
};

export default FileEditModal;
