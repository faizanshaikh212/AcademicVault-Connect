// src/components/UserGrid.tsx

import React from "react";
import { getAvatarUrl } from "@/lib/avatar";
import { User } from "../../types"; // Adjust this import path to your types file
import ChromaGrid, { ChromaItem } from "@/components/layout/ChromaGrid"; // Import the generic grid and its item type

// Define a set of color themes to cycle through for the cards
const cardThemes = [
  { borderColor: "#4F46E5", gradient: "linear-gradient(145deg,#4F46E5,#000)" },
  { borderColor: "#10B981", gradient: "linear-gradient(210deg,#10B981,#000)" },
  { borderColor: "#F59E0B", gradient: "linear-gradient(165deg,#F59E0B,#000)" },
  { borderColor: "#EF4444", gradient: "linear-gradient(195deg,#EF4444,#000)" },
  { borderColor: "#8B5CF6", gradient: "linear-gradient(225deg,#8B5CF6,#000)" },
  { borderColor: "#06B6D4", gradient: "linear-gradient(135deg,#06B6D4,#000)" },
];

interface UserGridProps {
  users: User[];
}

const UserGrid: React.FC<UserGridProps> = ({ users }) => {
  // This is the crucial step: transform your User[] data into ChromaItem[] data.
  const chromaItems: ChromaItem[] = users.map((user, index) => {
    const theme = cardThemes[index % cardThemes.length]; // Cycle through themes
    return {
      id: user._id, // Use a unique ID from your user object
      image: getAvatarUrl(
        user.profile?.avatar,
        user.premium?.isPremium,
        user.updatedAt
      ),
      title: `${user.firstName} ${user.lastName}`,
      subtitle: user.profile.bio || "No bio provided.",
      handle: `@${user.username}`,
      role: Array.isArray(user.role) ? user.role[0] : undefined,
      borderColor: theme.borderColor,
      gradient: theme.gradient,
      linkUrl: `/profile/${user.username}`, // The destination URL for the link
    };
  });

  // Now, render the generic ChromaGrid with the transformed items.
  return <ChromaGrid items={chromaItems} />;
};

export default UserGrid;
