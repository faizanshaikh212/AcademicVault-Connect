import { Button } from "@/components/ui/Button";
import { Edit } from "lucide-react";

interface MainPagesSectionProps {
  onEditPage: (slug: string) => void;
}

const MainPagesSection: React.FC<MainPagesSectionProps> = ({ onEditPage }) => {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Main Pages</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Button
          variant="outline"
          onClick={() => onEditPage("about-us")}
          className="h-24 flex flex-col items-center justify-center gap-2"
        >
          <Edit className="h-5 w-5" />
          Edit About Us Page
        </Button>
        <Button
          variant="outline"
          onClick={() => onEditPage("terms-and-conditions")}
          className="h-24 flex flex-col items-center justify-center gap-2"
        >
          <Edit className="h-5 w-5" />
          Edit Terms & Conditions
        </Button>
        <Button
          variant="outline"
          onClick={() => onEditPage("privacy-policy")}
          className="h-24 flex flex-col items-center justify-center gap-2"
        >
          <Edit className="h-5 w-5" />
          Edit Privacy Policy
        </Button>
      </div>
    </div>
  );
};

export default MainPagesSection;
