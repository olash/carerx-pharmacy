"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Edit05, Plus, Trash01 } from "@untitledui/icons";
import { deleteCategory, saveCategory } from "@/actions/admin/categories";
import { useToast } from "@/components/providers/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Card } from "@/components/ui/card";
import { categoryIcon } from "@/components/category-icon";
import { FeaturedIcon } from "@/components/ui/featured-icon";
import type { Category } from "@/lib/types";

type Row = Category & { count: number };

function CategoryForm({ category, onDone }: { category?: Row; onDone: () => void }) {
  const [state, action, pending] = useActionState(saveCategory, null);
  const toast = useToast();
  const router = useRouter();
  useEffect(() => {
    if (state?.ok) {
      toast({ tone: "success", title: state.message ?? "Saved" });
      router.refresh();
      onDone();
    }
  }, [state, toast, router, onDone]);
  return (
    <form action={action} className="flex flex-col gap-4">
      {category && <input type="hidden" name="id" value={category.id} />}
      <Input label="Name" name="name" required defaultValue={category?.name} placeholder="e.g. Skin Care" error={state && !state.ok ? state.error : undefined} />
      <Input label="Short description" name="description" defaultValue={category?.description ?? ""} placeholder="Shown on the homepage tile" />
      <Input label="Sort order" name="sort_order" type="number" min={0} defaultValue={category?.sort_order ?? 0} hint="Lower numbers appear first." wrapperClassName="max-w-40" />
      <div className="mt-2 flex justify-end gap-3">
        <Button variant="secondary" onClick={onDone}>Cancel</Button>
        <Button type="submit" loading={pending}>{category ? "Save" : "Add category"}</Button>
      </div>
    </form>
  );
}

export function CategoryManager({ categories }: { categories: Row[] }) {
  const [editing, setEditing] = useState<Row | "new" | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();

  return (
    <>
      <div className="flex justify-end">
        <Button iconLeading={Plus} onClick={() => setEditing("new")}>Add category</Button>
      </div>
      <Card className="mt-4 overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {categories.map((c) => (
            <li key={c.id} className="flex items-center gap-4 px-4 py-4 sm:px-6">
              <FeaturedIcon icon={categoryIcon(c.slug)} size="md" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                <p className="truncate text-sm text-gray-600">{c.description ?? "—"}</p>
              </div>
              <span className="hidden text-sm text-gray-600 sm:block">{c.count} {c.count === 1 ? "medicine" : "medicines"}</span>
              <div className="flex gap-1">
                <button type="button" onClick={() => setEditing(c)} className="rounded-md p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-600" aria-label={`Edit ${c.name}`}>
                  <Edit05 className="size-5" />
                </button>
                <button type="button" onClick={() => setDeleting(c)} className="rounded-md p-2 text-gray-400 hover:bg-gray-50 hover:text-error-600" aria-label={`Delete ${c.name}`}>
                  <Trash01 className="size-5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </Card>
      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "Add category" : "Edit category"}>
        {editing !== null && <CategoryForm key={editing === "new" ? "new" : editing.id} category={editing === "new" ? undefined : editing} onDone={() => setEditing(null)} />}
      </Modal>
      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        icon={Trash01}
        tone="error"
        title={`Delete “${deleting?.name}”?`}
        description={deleting?.count ? `${deleting.count} medicines will become uncategorised. They stay in your inventory.` : "This category has no medicines."}
        footer={
          <>
            <Button variant="secondary" size="lg" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button
              variant="destructive"
              size="lg"
              loading={pending}
              onClick={() =>
                start(async () => {
                  const res = await deleteCategory(deleting!.id);
                  toast(res.ok ? { tone: "success", title: res.message ?? "Deleted" } : { tone: "error", title: res.error });
                  setDeleting(null);
                  router.refresh();
                })
              }
            >
              Delete
            </Button>
          </>
        }
      />
    </>
  );
}
