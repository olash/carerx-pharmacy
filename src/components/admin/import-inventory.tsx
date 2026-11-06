"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Download01, UploadCloud02 } from "@untitledui/icons";
import { importDrugs } from "@/actions/admin/inventory";
import { useToast } from "@/components/providers/toast";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Alert } from "@/components/ui/alert";
import { FileDropzone } from "@/components/ui/file-upload";
import { csvToObjects } from "@/lib/csv";

export function ImportInventoryButton() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Record<string, string>[] | null>(null);
  const [result, setResult] = useState<{ created: number; updated: number; errors: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();

  const reset = () => {
    setFile(null);
    setRows(null);
    setResult(null);
    setError(null);
  };

  const onFile = async (f: File | null) => {
    reset();
    setFile(f);
    if (!f) return;
    const parsed = csvToObjects(await f.text());
    if (!parsed.length || !("name" in parsed[0]!) || !("price" in parsed[0]!)) {
      setError("The CSV needs at least “name” and “price” columns. Download the template to see the format.");
      return;
    }
    setRows(parsed);
  };

  return (
    <>
      <Button variant="secondary" iconLeading={UploadCloud02} onClick={() => setOpen(true)}>
        Import
      </Button>
      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          reset();
        }}
        icon={UploadCloud02}
        title="Import inventory from CSV"
        description={
          <>
            Add or update many medicines at once. Rows are matched by <code className="rounded bg-gray-100 px-1">slug</code> (or name + strength) — existing items are updated.
          </>
        }
        className="max-w-lg"
        footer={
          result ? (
            <Button size="lg" onClick={() => (setOpen(false), reset())}>Done</Button>
          ) : (
            <>
              <Button variant="secondary" size="lg" onClick={() => (setOpen(false), reset())}>Cancel</Button>
              <Button
                size="lg"
                disabled={!rows?.length}
                loading={pending}
                onClick={() =>
                  start(async () => {
                    const res = await importDrugs(rows!);
                    if (!res.ok) return setError(res.error);
                    setResult(res.data);
                    toast({ tone: "success", title: `Imported ${res.data.created + res.data.updated} medicines` });
                    router.refresh();
                  })
                }
              >
                Import {rows?.length ? `${rows.length} rows` : ""}
              </Button>
            </>
          )
        }
      >
        <div className="flex flex-col gap-4">
          <a href="/admin/inventory-export?template=1" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800">
            <Download01 className="size-4" /> Download CSV template
          </a>
          {!result && <FileDropzone file={file} onChange={onFile} accept="text/csv,application/vnd.ms-excel" hint="CSV file (max. 5MB)" maxBytes={5 * 1024 * 1024} id="csv" />}
          {rows && !result && <p className="text-sm text-gray-600">{rows.length} rows ready to import.</p>}
          {error && <Alert tone="error" title={error} />}
          {result && (
            <Alert tone={result.errors.length ? "warning" : "success"} title={`${result.created} added · ${result.updated} updated`}>
              {result.errors.length > 0 && (
                <ul className="mt-2 max-h-40 list-disc overflow-y-auto pl-4">
                  {result.errors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              )}
            </Alert>
          )}
        </div>
      </Modal>
    </>
  );
}
