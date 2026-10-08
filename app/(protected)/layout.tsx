import { ReactNode } from "react";
import Link from "next/link";
import { 
  LayoutDashboard, Users, Search, FileText, Send, Clock, 
  MessageSquare, Briefcase, BarChart, Webhook, Cpu, 
  Shield, Settings, UsersRound, LogOut
} from "lucide-react";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-background sm:flex overflow-y-auto">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6 sticky top-0 bg-background z-20">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="">Ai Lead Intel</span>
          </Link>
        </div>
        <div className="flex-1 py-4">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4 space-y-1">
            <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </Link>
            <Link href="/leads" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
              <Users className="h-4 w-4" /> Leads
            </Link>
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4">Coming Later</div>
            <Link href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary opacity-60">
              <Search className="h-4 w-4" /> Lead Discovery
            </Link>
            <Link href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary opacity-60">
              <FileText className="h-4 w-4" /> Proposal Studio
            </Link>
            <Link href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary opacity-60">
              <Send className="h-4 w-4" /> Campaigns
            </Link>
            <Link href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary opacity-60">
              <Clock className="h-4 w-4" /> Follow-ups
            </Link>
            <Link href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary opacity-60">
              <MessageSquare className="h-4 w-4" /> Conversations
            </Link>
            <Link href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary opacity-60">
              <Briefcase className="h-4 w-4" /> Portfolio
            </Link>
            <Link href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary opacity-60">
              <BarChart className="h-4 w-4" /> Analytics
            </Link>
            <Link href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary opacity-60">
              <Webhook className="h-4 w-4" /> Integrations
            </Link>
            <Link href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary opacity-60">
              <Cpu className="h-4 w-4" /> AI Settings
            </Link>
            <Link href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary opacity-60">
              <UsersRound className="h-4 w-4" /> Team
            </Link>
            <Link href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary opacity-60">
              <Shield className="h-4 w-4" /> Audit Logs
            </Link>
            <Link href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary opacity-60">
              <Settings className="h-4 w-4" /> Settings
            </Link>
          </nav>
        </div>
        <div className="mt-auto p-4 border-t sticky bottom-0 bg-background z-20">
          <form
            action={async () => {
              "use server";
              const { signOut } = await import("@/auth");
              await signOut();
            }}
          >
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </form>
        </div>
      </aside>
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-64 w-full">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <div className="flex-1"></div>
          <div className="font-semibold text-sm">User</div>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 max-w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
