import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BookMarked,
  Briefcase,
  CheckCircle2,
  Clock,
  Edit2,
  FolderKanban,
  Layers,
  MoreHorizontal,
  Plus,
  Rocket,
  Sparkles,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import type { ProjectMeta, Task } from "../types";
import { toast } from "sonner";

type ProjectsViewProps = {
  projects: ProjectMeta[];
  tasks: Task[];
  onSaveProject: (project: ProjectMeta) => Promise<void>;
  onDeleteProject: (projectId: string) => Promise<void>;
  onFilterByProject: (projectName: string) => void;
  onOpenNewTaskForProject: (projectName: string) => void;
};

const PROJECT_COLORS = [
  "#A78BFA", // Violet
  "#38BDF8", // Cyan
  "#4ADE80", // Green
  "#FBBF24", // Amber
  "#F87171", // Rose
  "#F472B6", // Pink
  "#A3E635", // Lime
];

export function ProjectsView({
  projects,
  tasks,
  onSaveProject,
  onDeleteProject,
  onFilterByProject,
  onOpenNewTaskForProject,
}: ProjectsViewProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectMeta | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#A78BFA");
  const [icon, setIcon] = useState("FolderKanban");

  const openCreateModal = () => {
    setEditingProject(null);
    setName("");
    setDescription("");
    setColor("#A78BFA");
    setIcon("FolderKanban");
    setModalOpen(true);
  };

  const openEditModal = (proj: ProjectMeta, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProject(proj);
    setName(proj.name);
    setDescription(proj.description || "");
    setColor(proj.color || "#A78BFA");
    setIcon(proj.icon || "FolderKanban");
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a project name.");
      return;
    }

    const payload: ProjectMeta = {
      id: editingProject?.id || `proj-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      color,
      icon,
      createdAt: editingProject?.createdAt || new Date().toISOString(),
    };

    await onSaveProject(payload);
    setModalOpen(false);
    toast.success(editingProject ? "Project updated" : "Project created");
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-5">
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-primary">
            Workspace Hub
          </span>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-foreground">
            Projects Portfolio
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Group related tasks, track progress velocity, and review milestones.
          </p>
        </div>

        <Button
          size="sm"
          className="h-8.5 gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
          onClick={openCreateModal}
        >
          <Plus className="size-3.5" />
          Create Project
        </Button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((proj) => {
          const associatedTasks = tasks.filter((t) => !t.deleted_at && t.project === proj.name);
          const completedCount = associatedTasks.filter((t) => t.completed).length;
          const progress =
            associatedTasks.length > 0
              ? Math.round((completedCount / associatedTasks.length) * 100)
              : 0;

          return (
            <div
              key={proj.id}
              onClick={() => onFilterByProject(proj.name)}
              className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:border-primary/50 hover:shadow-lg cursor-pointer"
            >
              <div>
                {/* Header with Project Color & Actions */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="size-3.5 rounded-full"
                      style={{ backgroundColor: proj.color }}
                    />
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {proj.name}
                    </h3>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-foreground"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="size-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36 border-border bg-card">
                      <DropdownMenuItem
                        className="text-xs cursor-pointer gap-2"
                        onClick={(e) => openEditModal(proj, e)}
                      >
                        <Edit2 className="size-3.5" /> Edit Project
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-xs cursor-pointer gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenNewTaskForProject(proj.name);
                        }}
                      >
                        <Plus className="size-3.5" /> Add Task
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-border" />
                      <DropdownMenuItem
                        className="text-xs cursor-pointer gap-2 text-destructive focus:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteProject(proj.id);
                        }}
                      >
                        <Trash2 className="size-3.5" /> Delete Project
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Description */}
                <p className="text-xs text-muted-foreground line-clamp-2 min-h-8">
                  {proj.description || "No project description provided."}
                </p>
              </div>

              {/* Progress & Stats Footer */}
              <div className="mt-5 space-y-2 pt-3 border-t border-border/50">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-muted-foreground">
                    {completedCount} / {associatedTasks.length} tasks completed
                  </span>
                  <span className="font-semibold text-foreground">{progress}%</span>
                </div>

                <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: proj.color || "#A78BFA",
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                  <span>
                    Created {format(new Date(proj.createdAt || Date.now()), "MMM d, yyyy")}
                  </span>
                  <span className="text-primary font-medium group-hover:underline">
                    View Tasks →
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for Project Create / Edit */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md border-border bg-card p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {editingProject ? "Edit Project" : "Create New Project"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Project Name</Label>
              <Input
                autoFocus
                placeholder="e.g. Website Redesign"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-secondary/40 border-border text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Description</Label>
              <Textarea
                placeholder="High-level objectives or milestone goals…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="bg-secondary/40 border-border text-xs resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Color Tag</Label>
              <div className="flex items-center gap-2">
                {PROJECT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`size-6 rounded-full transition-transform ${
                      color === c
                        ? "scale-125 ring-2 ring-primary ring-offset-2 ring-offset-card"
                        : ""
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-primary text-primary-foreground text-xs">
                {editingProject ? "Update Project" : "Create Project"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
