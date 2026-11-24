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
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick(e as unknown as React.MouseEvent<HTMLDivElement>);
              }
            }
          : undefined
      }
      className={cn(
        "bg-[#13151b] border border-white/[0.08] rounded-xl text-[#f3f4f6]",
        hover &&
          "hover:border-white/20 hover:bg-[#181b23] transition-colors duration-150 ease-out cursor-pointer",
        onClick && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20",
        className
      )}
    >
      {children}
    </div>
  );
}
