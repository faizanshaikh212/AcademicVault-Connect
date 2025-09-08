import React from "react";
import { AcademicNote } from "../../types/academic";
import { toast } from "react-hot-toast";
import ResourceEditModal from "./ResourceEditModal";

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
    <ResourceEditModal
      isOpen={isOpen}
      onClose={onClose}
      resourceType="notes"
      resource={note as any}
      initialValues={note}
      onSubmit={handleSubmit}
    />
  );
};

export default NotesEditModal;
