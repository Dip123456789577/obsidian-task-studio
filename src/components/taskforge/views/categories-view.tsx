import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Archive,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Heart,
  MoreHorizontal,
  Plus,
  ShoppingCart,
  Trash2,
  User,
} from "lucide-react";
import type { CategoryMeta, Task } from "../types";
import { toast } from "sonner";

type CategoriesViewProps = {
  categories: CategoryMeta[];
  tasks: Task[];
  onSaveCategory: (category: CategoryMeta) => Promise<void>;
  onDeleteCategory: (categoryId: string) => Promise<void>;
  onFilterByCategory: (categoryName: string) => void;
  onOpenNewTaskForCategory: (categoryName: string) => void;
};

const CATEGORY_COLORS = [
  "#8B5CF6", // Purple
  "#38BDF8", // Cyan
  "#FBBF24", // Amber
  "#4ADE80", // Green
  "#F43F5E", // Rose
  "#A78BFA", // Light Purple
];

export function CategoriesView({
  categories,
  tasks,
  onSaveCategory,
  onDeleteCategory,
  onFilterByCategory,
  onOpenNewTaskForCategory,
}: CategoriesViewProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryMeta | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#8B5CF6");

  const openCreateModal = () => {
    setEditingCategory(null);
    setName("");
    setColor("#8B5CF6");
    setModalOpen(true);
  };

  const openEditModal = (cat: CategoryMeta, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCategory(cat);
    setName(cat.name);
    setColor(cat.color || "#8B5CF6");
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a category name.");
      return;
    }

    const payload: CategoryMeta = {
      id: editingCategory?.id || `cat-${Date.now()}`,
      name: name.trim(),
      icon: editingCategory?.icon || "Archive",
      color,
    };

    await onSaveCategory(payload);
    setModalOpen(false);
    toast.success(editingCategory ? "Category updated" : "Category created");
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-5">
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-primary">
            Context Framework
          </span>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-foreground">
            Categories & Domains
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Segment your life and work into clear, actionable domains.
          </p>
        </div>

        <Button
          size="sm"
          className="h-8.5 gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
          onClick={openCreateModal}
        >
          <Plus className="size-3.5" />
          Create Category
        </Button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const associatedTasks = tasks.filter((t) => !t.deleted_at && t.category === cat.name);
          const completedCount = associatedTasks.filter((t) => t.completed).length;
          const progress =
            associatedTasks.length > 0
              ? Math.round((completedCount / associatedTasks.length) * 100)
              : 0;

          return (
            <div
              key={cat.id}
              onClick={() => onFilterByCategory(cat.name)}
              className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:border-primary/50 hover:shadow-lg cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="size-3 rounded-full" style={{ backgroundColor: cat.color }} />
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {cat.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => openEditModal(cat, e)}
                      title="Edit Category"
                    >
                      <MoreHorizontal className="size-3.5" />
                    </Button>
                    {/* Don't delete built-in defaults unless custom */}
                    {!["work", "personal", "study", "health", "shopping"].includes(
                      cat.id.toLowerCase(),
                    ) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteCategory(cat.id);
                        }}
                        title="Delete Category"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-muted-foreground mt-4">
                  <span>{associatedTasks.length} total tasks</span>
                  <span className="text-foreground font-semibold">{progress}%</span>
                </div>

                <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden mt-2">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: cat.color || "#8B5CF6",
                    }}
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between pt-2 border-t border-border/40 text-[11px]">
                <span className="text-muted-foreground">{completedCount} completed</span>
                <span className="text-primary font-medium group-hover:underline">
                  Filter Tasks →
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Category Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md border-border bg-card p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {editingCategory ? "Edit Category" : "New Domain Category"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Category Name</Label>
              <Input
                autoFocus
                placeholder="e.g. Finances, Creative…"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-secondary/40 border-border text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Color</Label>
              <div className="flex items-center gap-2">
                {CATEGORY_COLORS.map((c) => (
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
                {editingCategory ? "Update Category" : "Save Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
