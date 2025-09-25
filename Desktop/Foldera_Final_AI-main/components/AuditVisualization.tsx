"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

export function AuditVisualization() {
  const [discrepancies, setDiscrepancies] = useState<any[]>([]);
  useEffect(() => {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    supabase.from("discrepancies").select("*").then(({ data }) => setDiscrepancies(data || []));
  }, []);

  return (
    <div>
      <h2>Audit Results ({discrepancies.length})</h2>
      <ul>
        {discrepancies.map((d) => (
          <li key={d.id}>{d.severity}: {d.type} in {d.fileA} vs {d.fileB}</li>
        ))}
      </ul>
    </div>
  );
}