import React from "react";
import { Link } from "react-router-dom";
import { User } from "../../types";
import { Button } from "../ui/Button";

interface UserCardProps {
  user: User;
}

const UserCard: React.FC<UserCardProps> = ({ user }) => {
  return (
    <div className="flex flex-col items-center text-center p-6 rounded-lg border bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <img
        src={user.profile.avatar || `https://i.pravatar.cc/96?u=${user._id}`}
        alt={user.username}
        className="h-24 w-24 rounded-full object-cover ring-2 ring-offset-2 ring-offset-background dark:ring-offset-gray-900 ring-blue-500"
      />
      <h3 className="mt-4 text-lg font-semibold">
        {user.firstName} {user.lastName}
      </h3>
      <p className="text-sm text-blue-500">@{user.username}</p>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 h-10 line-clamp-2">
        {user.profile.bio || "No bio provided."}
      </p>
      <Button asChild variant="outline" className="mt-4 w-full">
        <Link to={`/profile/${user.username}`}>View Profile</Link>
      </Button>
    </div>
  );
};

export default UserCard;
