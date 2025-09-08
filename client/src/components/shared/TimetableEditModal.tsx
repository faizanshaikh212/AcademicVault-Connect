import React from "react";
import { Timetable } from "../../types/academic";
import { toast } from "react-hot-toast";
import ResourceEditModal from "./ResourceEditModal";

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
    <ResourceEditModal
      isOpen={isOpen}
      onClose={onClose}
      resourceType="timetables"
      resource={timetable as any}
      initialValues={timetable}
      onSubmit={handleSubmit}
    />
  );
};

export default TimetableEditModal;
