import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

export default function Card({
  children,
  className,
  hover = false,
  onClick,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-[#141414] border border-[rgba(255,255,255,0.06)] rounded-xl animate-card-in",
        hover &&
          "hover:border-[rgba(20,184,166,0.3)] hover:bg-[#181818] transition-all duration-300 cursor-pointer hover:shadow-[0_8px_30px_rgba(0,0,0,0.4),0_0_20px_rgba(13,148,136,0.12)] hover:-translate-y-0.5",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}
