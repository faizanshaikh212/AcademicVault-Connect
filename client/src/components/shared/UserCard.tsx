// src/components/shared/UserCard.tsx

import React from "react";
import { Link } from "react-router-dom";
import { User } from "../../types";
import { getAvatarUrl } from "@/lib/avatar";

interface UserCardProps {
  user: User;
}

const UserCard: React.FC<UserCardProps> = ({ user }) => {
  const ownerIsPremium = user?.premium?.isPremium || false;

  return (
    <article className="group h-full border-b border-gray-200 pb-3 dark:border-gray-700">
      <Link
        to={`/profile/${user.username}`}
        className="flex h-full flex-col"
      >
        <div className="flex items-center gap-4 py-4">
          <img
            src={getAvatarUrl(
              user.profile?.avatar,
              ownerIsPremium,
              user.updatedAt
            )}
            alt={user.username}
            loading="lazy"
            className="h-16 w-16 shrink-0 rounded-full object-cover"
          />
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-slate-900 dark:text-white">
              {`${user.firstName} ${user.lastName}`}
            </h3>
            <p className="truncate text-sm text-slate-500 dark:text-gray-400">
              @{user.username}
            </p>
          </div>
        </div>
        <footer className="mt-auto pl-20">
          <p className="min-h-10 text-sm leading-5 text-slate-600 dark:text-gray-400 line-clamp-2">
            {user.profile.bio || "No bio provided."}
          </p>
          <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-300">
            View profile <span aria-hidden="true">→</span>
          </span>
        </footer>
      </Link>
    </article>
  );
};

export default UserCard;
