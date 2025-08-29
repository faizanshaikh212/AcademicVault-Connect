export const isIframeSupported = (url: string): boolean => {
  const supportedExtensions = [
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx",
    ".txt",
    ".html",
    ".htm",
  ];

  // Google Drive and Office 365 links
  if (
    url.includes("docs.google.com") ||
    url.includes("office.com") ||
    url.includes("office365.com")
  ) {
    return true;
  }

  // Check file extensions
  return supportedExtensions.some((ext) => url.toLowerCase().endsWith(ext));
};

export const getIframeSrc = (url: string): string => {
  // Handle Google Drive links
  if (url.includes("drive.google.com")) {
    return url.replace("/view", "/preview");
  }

  // Handle Office 365 links
  if (url.includes("office.com") || url.includes("office365.com")) {
    return url.replace("?web=1", "?embed=true");
  }

  return url;
};
