"use client";

import { useRef, useState } from "react";
import { createFramework } from "@/app/actions/frameworks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function CreateFrameworkForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [name, setName] = useState("");
  const [instructions, setInstructions] = useState("");

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        if (!name.trim() || !instructions.trim()) return;
        await createFramework(formData);
        formRef.current?.reset();
        setName("");
        setInstructions("");
      }}
      className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm"
    >
      <div>
        <label className="text-sm font-medium">Name</label>
        <Input
          name="name"
          placeholder="e.g. Cash Flow First"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Instructions</label>
        <Textarea
          name="instructions"
          placeholder="Describe how you want stocks evaluated — what to weigh, what to ignore, how you think about quality and a fair price."
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          required
          className="mt-1"
          rows={5}
        />
      </div>
      <Button type="submit">Create Framework</Button>
    </form>
  );
}
