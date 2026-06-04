import { isMenuIconImage } from "@/lib/categories/menuIcon";
import { sanitizeDisplayIcon } from "@/lib/ui/symbols";

type MenuIconProps = {
  icon: string;
  className?: string;
  emojiClassName?: string;
  imageClassName?: string;
  alt?: string;
};

export default function MenuIcon({
  icon,
  className,
  emojiClassName,
  imageClassName = "h-full w-full rounded-[inherit] object-cover",
  alt = "",
}: MenuIconProps) {
  const displayIcon = sanitizeDisplayIcon(icon);

  if (isMenuIconImage(displayIcon)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={displayIcon} alt={alt} className={imageClassName} />
    );
  }

  return <span className={emojiClassName ?? className}>{displayIcon}</span>;
}
