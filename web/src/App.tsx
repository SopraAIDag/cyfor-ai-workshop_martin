import { type FormEvent, useState } from "react";
import {
  getGetItemsQueryKey,
  useDeleteItemsId,
  useGetItems,
  usePostItems,
  usePutItemsId,
} from "./api";
import { useQueryClient } from "@tanstack/react-query";

const CATEGORY_OPTIONS = ["general", "room", "equipment", "vehicle"] as const;

interface EditState {
  id: number;
  title: string;
  description: string;
  category: string;
}

export default function App() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [editState, setEditState] = useState<EditState | null>(null);

  const queryClient = useQueryClient();
  const refreshItems = () =>
    queryClient.invalidateQueries({ queryKey: getGetItemsQueryKey() });

  const itemsQuery = useGetItems();

  const createItemMutation = usePostItems({
    mutation: {
      onSuccess: async () => {
        setTitle("");
        setDescription("");
        setCategory("general");
        await refreshItems();
      },
    },
  });

  const updateItemMutation = usePutItemsId({
    mutation: {
      onSuccess: async () => {
        setEditState(null);
        await refreshItems();
      },
    },
  });

  const deleteItemMutation = useDeleteItemsId({
    mutation: {
      onSuccess: refreshItems,
    },
  });

  const trimmedTitle = title.trim();
  const items = itemsQuery.data?.items ?? [];
  const deletingItemId = deleteItemMutation.variables?.id;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmedTitle || createItemMutation.isPending) return;
    createItemMutation.mutate({
      data: {
        title: trimmedTitle,
        description: description.trim() || undefined,
        category,
      },
    });
  };

  const handleEdit = (item: {
    id: number;
    title: string;
    description: string | null;
    category: string;
  }) => {
    setEditState({
      id: item.id,
      title: item.title,
      description: item.description ?? "",
      category: item.category,
    });
  };

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editState || !editState.title.trim() || updateItemMutation.isPending) return;
    updateItemMutation.mutate({
      id: editState.id,
      data: {
        title: editState.title.trim(),
        description: editState.description.trim() || undefined,
        category: editState.category,
      },
    });
  };

  const handleRemove = (id: number) => {
    if (deleteItemMutation.isPending) return;
    deleteItemMutation.mutate({ id });
  };

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">Resources</h1>
          <p className="text-sm text-slate-600">
            Create and manage bookable resources.
          </p>
        </header>

        <form
          className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          onSubmit={handleSubmit}
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Resource name"
            maxLength={120}
            className="rounded-md border border-slate-300 px-3 py-2 text-base outline-none focus:border-slate-500"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            maxLength={500}
            rows={2}
            className="resize-none rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          />
          <div className="flex gap-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {capitalize(opt)}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={!trimmedTitle || createItemMutation.isPending}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {createItemMutation.isPending ? "Adding..." : "Add resource"}
            </button>
          </div>
        </form>

        {createItemMutation.isError ? (
          <p className="text-sm text-rose-600">
            Could not add the resource: {createItemMutation.error.message}
          </p>
        ) : null}

        {updateItemMutation.isError ? (
          <p className="text-sm text-rose-600">
            Could not update the resource: {updateItemMutation.error.message}
          </p>
        ) : null}

        {deleteItemMutation.isError ? (
          <p className="text-sm text-rose-600">
            Could not remove the resource: {deleteItemMutation.error.message}
          </p>
        ) : null}

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-medium text-slate-700">Resources</h2>

          {itemsQuery.isPending ? (
            <p className="mt-3 text-sm text-slate-600">Loading resources...</p>
          ) : null}

          {itemsQuery.isError ? (
            <p className="mt-3 text-sm text-rose-600">
              Could not load resources: {itemsQuery.error.message}
            </p>
          ) : null}

          {!itemsQuery.isPending && !itemsQuery.isError ? (
            items.length > 0 ? (
              <ul className="mt-3 divide-y divide-slate-200">
                {items.map((item) =>
                  editState?.id === item.id ? (
                    <li key={item.id} className="py-3">
                      <form className="flex flex-col gap-2" onSubmit={handleSave}>
                        <input
                          value={editState.title}
                          onChange={(e) =>
                            setEditState({ ...editState, title: e.target.value })
                          }
                          maxLength={120}
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-slate-500"
                        />
                        <textarea
                          value={editState.description}
                          onChange={(e) =>
                            setEditState({ ...editState, description: e.target.value })
                          }
                          maxLength={500}
                          rows={2}
                          className="resize-none rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-slate-500"
                        />
                        <select
                          value={editState.category}
                          onChange={(e) =>
                            setEditState({ ...editState, category: e.target.value })
                          }
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-slate-500"
                        >
                          {CATEGORY_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {capitalize(opt)}
                            </option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={
                              !editState.title.trim() || updateItemMutation.isPending
                            }
                            className="rounded-md bg-slate-900 px-3 py-1 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                          >
                            {updateItemMutation.isPending ? "Saving..." : "Save"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditState(null)}
                            className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </li>
                  ) : (
                    <li
                      key={item.id}
                      className="flex items-start justify-between gap-3 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{item.title}</p>
                        {item.description ? (
                          <p className="mt-0.5 text-sm text-slate-600">
                            {item.description}
                          </p>
                        ) : null}
                        <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                          {capitalize(item.category)}
                        </span>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemove(item.id)}
                          disabled={deleteItemMutation.isPending}
                          className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                        >
                          {deleteItemMutation.isPending && deletingItemId === item.id
                            ? "Removing..."
                            : "Remove"}
                        </button>
                      </div>
                    </li>
                  )
                )}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-600">No resources yet.</p>
            )
          ) : null}
        </section>
      </div>
    </main>
  );
}
