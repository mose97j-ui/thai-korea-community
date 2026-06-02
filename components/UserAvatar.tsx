"use client";

import { isOperatorUser } from "@/lib/auth/operator";
import { getUserNickname } from "@/lib/auth/profileImage";
import { useOperatorView } from "@/hooks/useOperatorView";
import type { User } from "@/lib/auth/types";

const sizeClasses = {
  sm: "h-11 w-11 text-lg",
  md: "h-16 w-16 text-2xl",
  lg: "h-20 w-20 text-3xl",
  nav: "h-[4.25rem] w-[4.25rem] text-2xl sm:h-[4.5rem] sm:w-[4.5rem]",
} as const;

const shapeClasses = {
  round: "rounded-full",
  square: "rounded-[22px]",
  sharp: "rounded-none",
} as const;

type UserAvatarProps = {
  user: User;
  size?: keyof typeof sizeClasses;
  shape?: keyof typeof shapeClasses;
  className?: string;
};

export default function UserAvatar({
  user,
  size = "md",
  shape = "round",
  className = "",
}: UserAvatarProps) {
  const { showOperatorUI } = useOperatorView();
  const operator = showOperatorUI && isOperatorUser(user);
  const label = getUserNickname(user);
  const shapeClass = shapeClasses[shape];
  const frameClass =
    shape === "sharp"
      ? size === "nav"
        ? "border-2 border-gray-900 shadow-sm"
        : "border-4 border-gray-900 shadow-sm"
      : "shadow-sm ring-2 ring-white";

  if (user.profileImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.profileImage}
        alt={label}
        className={`${sizeClasses[size]} shrink-0 object-cover ${frameClass} ${shapeClass} ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} flex shrink-0 items-center justify-center ${frameClass} ${shapeClass} ${
        operator ? "bg-amber-100" : "bg-sky-100"
      } ${className}`}
      aria-hidden
    >
      {operator ? "👑" : "👤"}
    </div>
  );
}
