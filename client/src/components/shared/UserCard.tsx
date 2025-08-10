// src/components/shared/UserCard.tsx

import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { User } from "../../types";
import { getAvatarUrl } from "@/lib/avatar";

interface UserCardProps {
  user: User;
  borderColor?: string;
  gradient?: string;
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  borderColor = "#4F46E5",
  gradient = "linear-gradient(145deg, #4F46E5, #000)",
}) => {
  const cardRef = useRef<HTMLElement>(null);
  const ownerIsPremium = user?.premium?.isPremium || false;

  // This handler creates the 3D tilt effect based on mouse position.
  const handleCardMove = (e: React.MouseEvent<HTMLElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const { width, height } = rect;
    const rotateX = (y / height - 0.5) * -20; // Tilt up/down
    const rotateY = (x / width - 0.5) * 20; // Tilt left/right

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  // Resets the card's transform when the mouse leaves.
  const handleCardLeave = () => {
    const card = cardRef.current;
    if (card) {
      card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";
    }
  };

  return (
    <article
      ref={cardRef}
      onMouseMove={handleCardMove}
      onMouseLeave={handleCardLeave}
      className="group relative flex flex-col w-full max-w-[300px] mx-auto rounded-2xl overflow-hidden transition-transform duration-300 ease-out"
      style={
        {
          background: gradient,
          "--glow-color": borderColor,
          transformStyle: "preserve-3d", // Necessary for 3D transforms
        } as React.CSSProperties
      }
    >
      {/* Base border that lights up on hover */}
      <div className="absolute inset-0 z-0 transition-colors duration-300 bg-transparent border-2 border-slate-800 rounded-2xl group-hover:border-[var(--glow-color)]" />

      {/* The Link now wraps all content, making the entire card clickable */}
      <Link
        to={`/profile/${user.username}`}
        className="relative z-30 flex flex-col flex-1"
        style={{ transform: "translateZ(20px)" }} // Lifts content slightly
      >
        <div className="flex-1 p-2.5">
          {/* Image container with 1:1 aspect ratio */}
          <div className="w-48 h-48 mx-auto rounded-full overflow-hidden">
            <img
              src={getAvatarUrl(
                user.profile?.avatar,
                ownerIsPremium,
                user.updatedAt
              )}
              alt={user.username}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        <footer className="p-4 text-white font-sans grid grid-cols-[1fr_auto] gap-x-3 gap-y-1">
          <h3 className="m-0 text-base font-semibold">{`${user.firstName} ${user.lastName}`}</h3>
          <span className="text-sm opacity-70 text-right">
            @{user.username}
          </span>
          <p className="m-0 col-span-full text-sm opacity-80 line-clamp-2">
            {user.profile.bio || "No bio provided."}
          </p>
        </footer>
      </Link>
    </article>
  );
};

export default UserCard;
