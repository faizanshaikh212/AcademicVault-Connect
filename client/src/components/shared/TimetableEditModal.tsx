import React from "react";
import { Timetable } from "../../types/academic";
import { toast } from "react-hot-toast";
import BaseEditModal from "./BaseEditModal";
import AcademicResourceForm from "./AcademicResourceForm";

interface TimetableEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  timetable: Timetable;
  onSubmit: (values: Partial<Timetable>) => Promise<void>;
}

const TimetableEditModal: React.FC<TimetableEditModalProps> = ({
  isOpen,
  onClose,
  timetable,
  onSubmit,
}) => {
  const handleSubmit = async (data: FormData | Partial<any>) => {
    try {
      const payload = data instanceof FormData ? {} : (data as any);
      // preserve tags or other fields if missing
      payload.tags = payload.tags || timetable.tags;
      await onSubmit(payload as Partial<Timetable>);
      onClose();
    } catch (error) {
      console.error("Error updating timetable:", error);
      toast.error("Failed to update timetable");
      throw error;
    }
  };

  return (
    <BaseEditModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Timetable Details"
    >
      <AcademicResourceForm
        initialValues={timetable as any}
        resourceType="timetables"
        createMode={false}
        onCancel={onClose}
        onSubmit={handleSubmit}
        submitLabel="Save Changes"
      />
    </BaseEditModal>
  );
};

export default TimetableEditModal;
