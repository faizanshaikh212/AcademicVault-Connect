import React from "react";
import AcademicNotesForm from "./forms/AcademicNotesForm";
import QuestionPaperForm from "./forms/QuestionPaperForm";
import SyllabusForm from "./forms/SyllabusForm";
import TimetableForm from "./forms/TimetableForm";

export type ResourceType =
  | "notes"
  | "questionPapers"
  | "syllabus"
  | "timetables";

interface Props {
  initialValues?: any;
  resourceType: ResourceType;
  createMode?: boolean;
  onCancel: () => void;
  onSubmit: (data: FormData | any) => Promise<void>;
  submitLabel?: string;
  loading?: boolean;
}

const AcademicResourceForm: React.FC<Props> = (props) => {
  const { resourceType } = props;
  switch (resourceType) {
    case "notes":
      return <AcademicNotesForm {...props} />;
    case "questionPapers":
      return <QuestionPaperForm {...props} />;
    case "syllabus":
      return <SyllabusForm {...props} />;
    case "timetables":
      return <TimetableForm {...props} />;
    default:
      return null;
  }
};

export default AcademicResourceForm;
