import React from "react";

const TermsAndConditions: React.FC = () => (
  <div className="max-w-3xl mx-auto py-12 px-4 pt-30">
    <h1 className="text-3xl font-bold mb-6">Terms & Conditions</h1>
    <div className="prose dark:prose-invert">
      {/* Content will be editable by admin */}
      <p>
        Welcome to Academic Vault. These terms and conditions outline the rules
        and regulations for the use of our website...
      </p>
    </div>
  </div>
);

export default TermsAndConditions;
