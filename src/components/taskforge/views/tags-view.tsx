import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Tag, Tags, Plus, CheckCircle2 } from "lucide-react";
import type { Task } from "../types";

type TagsViewProps = {
  tasks: Task[];
  onFilterByTag: (tagName: string) => void;
  onOpenNewTaskWithTag: (tagName: string) => void;
};

export function TagsView({ tasks, onFilterByTag, onOpenNewTaskWithTag }: TagsViewProps) {
  const [search, setSearch] = useState("");

  const liveTasks = tasks.filter((t) => !t.deleted_at);

  // Collect all unique tags and stats
  const tagStats = new Map<string, { total: number; completed: number }>();
  liveTasks.forEach((task) => {
    task.tags.forEach((t) => {
      const clean = t.trim().toLowerCase();
      if (!clean) return;
      const cur = tagStats.get(clean) || { total: 0, completed: 0 };
      cur.total += 1;
      if (task.completed) cur.completed += 1;
      tagStats.set(clean, cur);
    });
  });

  const allTags = Array.from(tagStats.entries())
    .map(([name, stat]) => ({
      name,
      total: stat.total,
      completed: stat.completed,
      progress: Math.round((stat.completed / stat.total) * 100),
    }))
    .filter((t) => t.name.includes(search.trim().toLowerCase()))
    .sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-5">
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-primary">
            Cross-Project Metadata
          </span>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-foreground">
            Tag Cloud & Taxonomy
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Flexible multidimensional tagging across projects and workflows.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search tags…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8.5 w-48 pl-8 text-xs bg-secondary/50 border-border"
            />
          </div>
        </div>
      </div>

      {/* Tags Cards Grid */}
      {allTags.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-xs text-muted-foreground space-y-2">
          <Tags className="mx-auto size-7 text-muted-foreground/40" />
          <p className="font-medium text-foreground">No tags found</p>
          <p>Add #tags to your tasks to populate your taxonomy cloud.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {allTags.map((tag) => (
            <div
              key={tag.name}
              onClick={() => onFilterByTag(tag.name)}
              className="group rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                    #{tag.name}
                  </span>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {tag.total}
                  </Badge>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                  <span>Progress</span>
                  <span>{tag.progress}%</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${tag.progress}%` }}
                  />
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t border-border/40">
                <span>{tag.completed} completed</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenNewTaskWithTag(tag.name);
                  }}
                  className="text-primary hover:underline"
                >
                  + Add task
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
