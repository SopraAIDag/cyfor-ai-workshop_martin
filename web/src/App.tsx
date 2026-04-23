import { type FormEvent, useEffect, useState } from "react";
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
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const queryClient = useQueryClient();
  const refreshItems = () =>
    queryClient.invalidateQueries({ queryKey: getGetItemsQueryKey() });

  const searchParam = debouncedSearch || undefined;
  const itemsQuery = useGetItems({ search: searchParam });

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
    <>
      <header className="flex h-14 items-center bg-[#262122] px-6">
        <span className="text-base font-semibold uppercase tracking-wide text-white">
          Forsvaret
        </span>
        <span className="ml-3 text-sm text-[#767672]">Ressursbooking</span>
      </header>

      <main className="min-h-screen bg-[#F5F5F0] px-4 py-10 text-[#262122]">
        <div className="mx-auto max-w-xl space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Resources</h1>
            <p className="text-sm text-[#767672]">
              Create and manage bookable resources.
            </p>
          </div>

          <form
            className="flex flex-col gap-3 rounded-sm border border-[#D8D8D0] bg-white p-4"
            onSubmit={handleSubmit}
          >
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Resource name"
              maxLength={120}
              className="rounded-sm border border-[#D8D8D0] px-3 py-2 text-base outline-none placeholder:text-[#767672] focus:border-[#262122]"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              maxLength={500}
              rows={2}
              className="resize-none rounded-sm border border-[#D8D8D0] px-3 py-2 text-sm outline-none placeholder:text-[#767672] focus:border-[#262122]"
            />
            <div className="flex gap-3">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex-1 rounded-sm border border-[#D8D8D0] px-3 py-2 text-sm outline-none focus:border-[#262122]"
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
                className="rounded-sm bg-[#262122] px-4 py-2 text-sm font-semibold uppercase text-white disabled:cursor-not-allowed disabled:bg-[#D8D8D0] disabled:text-[#767672]"
              >
                {createItemMutation.isPending ? "Adding..." : "ADD RESOURCE"}
              </button>
            </div>
          </form>

          {createItemMutation.isError ? (
            <p className="text-sm text-[#DE0034]">
              Failed to add resource: {createItemMutation.error.message}
            </p>
          ) : null}

          {updateItemMutation.isError ? (
            <p className="text-sm text-[#DE0034]">
              Failed to update resource: {updateItemMutation.error.message}
            </p>
          ) : null}

          {deleteItemMutation.isError ? (
            <p className="text-sm text-[#DE0034]">
              Failed to remove resource: {deleteItemMutation.error.message}
            </p>
          ) : null}

          <div className="flex items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search resources"
              className="flex-1 rounded-sm border border-[#D8D8D0] px-3 py-2 text-sm outline-none placeholder:text-[#767672] focus:border-[#262122]"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="rounded-sm border border-[#262122] px-3 py-2 text-sm text-[#262122]"
              >
                Clear
              </button>
            ) : null}
          </div>

          <section className="rounded-sm border border-[#D8D8D0] bg-white p-4">
            <h2 className="text-sm font-semibold text-[#262122]">Resources</h2>

            {itemsQuery.isPending ? (
              <p className="mt-3 text-sm text-[#767672]">Loading...</p>
            ) : null}

            {itemsQuery.isError ? (
              <p className="mt-3 text-sm text-[#DE0034]">
                Failed to load resources: {itemsQuery.error.message}
              </p>
            ) : null}

            {!itemsQuery.isPending && !itemsQuery.isError ? (
              items.length > 0 ? (
                <ul className="mt-3 divide-y divide-[#D8D8D0]">
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
                            className="rounded-sm border border-[#D8D8D0] px-3 py-1.5 text-sm outline-none focus:border-[#262122]"
                          />
                          <textarea
                            value={editState.description}
                            onChange={(e) =>
                              setEditState({ ...editState, description: e.target.value })
                            }
                            maxLength={500}
                            rows={2}
                            className="resize-none rounded-sm border border-[#D8D8D0] px-3 py-1.5 text-sm outline-none focus:border-[#262122]"
                          />
                          <select
                            value={editState.category}
                            onChange={(e) =>
                              setEditState({ ...editState, category: e.target.value })
                            }
                            className="rounded-sm border border-[#D8D8D0] px-3 py-1.5 text-sm outline-none focus:border-[#262122]"
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
                              className="rounded-sm bg-[#262122] px-3 py-1 text-sm font-semibold uppercase text-white disabled:cursor-not-allowed disabled:bg-[#D8D8D0] disabled:text-[#767672]"
                            >
                              {updateItemMutation.isPending ? "Saving..." : "SAVE"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditState(null)}
                              className="rounded-sm border border-[#262122] px-3 py-1 text-sm text-[#262122]"
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
                            <p className="mt-0.5 text-sm text-[#767672]">
                              {item.description}
                            </p>
                          ) : null}
                          <span className="mt-1 inline-block rounded-sm bg-[#262122] px-2 py-0.5 text-xs uppercase text-white">
                            {capitalize(item.category)}
                          </span>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(item)}
                            className="rounded-sm border border-[#262122] px-3 py-1 text-sm text-[#262122]"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemove(item.id)}
                            disabled={deleteItemMutation.isPending}
                            className="rounded-sm bg-[#DE0034] px-3 py-1 text-sm font-medium uppercase text-white disabled:cursor-not-allowed disabled:bg-[#D8D8D0] disabled:text-[#767672]"
                          >
                            {deleteItemMutation.isPending && deletingItemId === item.id
                              ? "Removing..."
                              : "REMOVE"}
                          </button>
                        </div>
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-[#767672]">No resources registered.</p>
              )
            ) : null}
          </section>
        </div>
      </main>
    </>
  );
}
