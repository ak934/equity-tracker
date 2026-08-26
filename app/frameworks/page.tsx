import { Trash2 } from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { CreateFrameworkForm } from "@/components/CreateFrameworkForm";
import { deleteFramework } from "@/app/actions/frameworks";

export default async function FrameworksPage() {
  const { userId } = await auth.protect();

  const frameworks = await prisma.analysisFramework.findMany({
    where: { clerkUserId: userId },
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Frameworks</h1>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card p-4 shadow-sm">
        <p className="text-sm font-medium">Buffett (default)</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Value investing — moat, management quality, growth, and a margin of safety on price.
          Built in, always available, can&apos;t be edited or deleted.
        </p>
      </div>

      {frameworks.length > 0 && (
        <div className="mt-4 space-y-3">
          {frameworks.map((f) => (
            <div
              key={f.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <div>
                <p className="text-sm font-medium">{f.name}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                  {f.instructions}
                </p>
              </div>
              <form action={deleteFramework}>
                <input type="hidden" name="id" value={f.id} />
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Delete ${f.name}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              </form>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6">
        <CreateFrameworkForm />
      </div>
    </main>
  );
}
