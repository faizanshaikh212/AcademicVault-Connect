import React from "react";
import { Syllabus } from "../../types/academic";
import { toast } from "react-hot-toast";
import BaseEditModal from "./BaseEditModal";
import AcademicResourceForm from "./AcademicResourceForm";

interface SyllabusEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  syllabus: Syllabus;
  onSubmit: (values: Partial<Syllabus>) => Promise<void>;
}

const SyllabusEditModal: React.FC<SyllabusEditModalProps> = ({
  isOpen,
  onClose,
  syllabus,
  onSubmit,
}) => {
  const handleSubmit = async (data: FormData | Partial<any>) => {
    try {
      const payload = data instanceof FormData ? {} : (data as any);
      // keep existing prerequisites/tags if not provided by form
      payload.prerequisites = payload.prerequisites || syllabus.prerequisites;
      payload.tags = payload.tags || syllabus.tags;
      await onSubmit(payload as Partial<Syllabus>);
      onClose();
    } catch (error) {
      console.error("Error updating syllabus:", error);
      toast.error("Failed to update syllabus");
      throw error;
    }
  };

  return (
    <BaseEditModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Syllabus Details"
    >
      <AcademicResourceForm
        initialValues={syllabus as any}
        resourceType="syllabus"
        createMode={false}
        onCancel={onClose}
        onSubmit={handleSubmit}
        submitLabel="Save Changes"
      />
    </BaseEditModal>
  );
};

export default SyllabusEditModal;
