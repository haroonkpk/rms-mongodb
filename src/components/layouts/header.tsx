import { LogoutButton } from "@/components/logout-button";

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <div className="flex items-center justify-between p-2 sm:p-0 gap-4 mb-[clamp(1.5rem,3vw,2.5rem)]">
      <div className="min-w-0">
        <h1
          className="text-[#0A2540] font-bold truncate leading-tight"
          style={{ fontSize: "clamp(1.2rem, 3.5vw, 2.5rem)" }}
        >
          {title}
        </h1>
      </div>
      <div className="shrink-0 pt-2">
        <LogoutButton />
      </div>
    </div>
  );
}
