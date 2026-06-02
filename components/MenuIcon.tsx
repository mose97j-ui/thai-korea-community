import { isMenuIconImage } from "@/lib/categories/menuIcon";

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
  if (isMenuIconImage(icon)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={icon} alt={alt} className={imageClassName} />
    );
  }

  return <span className={emojiClassName ?? className}>{icon || "📌"}</span>;
}
