import React from "react";
import { AcademicNote } from "../../types/academic";
import { toast } from "react-hot-toast";
import BaseEditModal from "./BaseEditModal";
import AcademicResourceForm from "./AcademicResourceForm";

interface NotesEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: AcademicNote;
  onSubmit: (values: Partial<AcademicNote>) => Promise<void>;
}

const NotesEditModal: React.FC<NotesEditModalProps> = ({
  isOpen,
  onClose,
  note,
  onSubmit,
}) => {
  const handleSubmit = async (data: FormData | Partial<any>) => {
    try {
      const payload = data instanceof FormData ? {} : (data as any);
      // preserve tags if not provided
      payload.tags = payload.tags || note.tags;
      await onSubmit(payload as Partial<AcademicNote>);
      onClose();
    } catch (error) {
      console.error("Error updating note:", error);
      toast.error("Failed to update note");
      throw error;
    }
  };

  return (
    <BaseEditModal isOpen={isOpen} onClose={onClose} title="Edit Note Details">
      <AcademicResourceForm
        initialValues={note as any}
        resourceType="notes"
        createMode={false}
        onCancel={onClose}
        onSubmit={handleSubmit}
        submitLabel="Save Changes"
      />
    </BaseEditModal>
  );
};

export default NotesEditModal;
