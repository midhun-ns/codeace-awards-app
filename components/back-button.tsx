import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BackButton() {
  return (
    <Button
      variant="ghost"
      asChild
      className="text-slate-400 hover:text-white -ml-2 mb-4"
    >
      <Link href="/">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Link>
    </Button>
  );
}
