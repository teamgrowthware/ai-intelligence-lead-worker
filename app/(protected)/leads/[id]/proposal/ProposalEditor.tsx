"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { saveProposalEditAction } from "./actions";
import { useTransition } from "react";

export function ProposalEditor({ proposalId, leadId, initialContent }: { proposalId: string, leadId: string, initialContent: string }) {
  const [content, setContent] = useState(initialContent);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      await saveProposalEditAction(leadId, proposalId, content);
    });
  };

  return (
    <div className="flex flex-col space-y-4">
      <textarea
        className="w-full h-[600px] p-4 border rounded font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isPending || content === initialContent}>
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
