<template>
  <div class="space-y-5">
    <div>
      <h2 class="font-semibold">Library data</h2>
      <p class="text-sm opacity-60">Download a versioned JSON backup or append categories from a previous export.</p>
    </div>

    <div class="grid sm:grid-cols-2 gap-3">
      <section class="card card-border bg-base-200">
        <div class="card-body p-4">
          <h3 class="font-medium"><Icon name="mdi:download" /> Export</h3>
          <p class="text-sm opacity-60">Includes categories, descriptions, ordered items, tracks, and reasons.</p>
          <button class="btn btn-primary btn-sm mt-auto" :disabled="exporting" @click="exportLibrary">
            <span v-if="exporting" class="loading loading-spinner loading-xs" />
            Download JSON
          </button>
        </div>
      </section>
      <section class="card card-border bg-base-200">
        <div class="card-body p-4">
          <h3 class="font-medium"><Icon name="mdi:upload" /> Import</h3>
          <p class="text-sm opacity-60">Imports are validated and appended atomically. Existing data is not replaced.</p>
          <input ref="fileInput" type="file" accept="application/json,.json" class="file-input file-input-sm w-full" @change="chooseImport" />
        </div>
      </section>
    </div>

    <p v-if="error" class="alert alert-error text-sm">{{ error }}</p>
    <p v-if="message" class="alert alert-success text-sm">{{ message }}</p>

    <UiConfirmDialog
      :open="!!pendingImport"
      title="Import library data?"
      :message="`Append ${pendingImport?.categories.length ?? 0} categories from ${pendingFileName}?`"
      confirm-label="Import library"
      :busy="importing"
      :error="error"
      @cancel="cancelImport"
      @confirm="importLibrary"
    />
  </div>
</template>

<script setup lang="ts">
import type { LibraryExport } from "#shared/contracts";
import { getApiErrorMessage } from "~/services/api";
import { libraryApi } from "~/services/library";

const { refresh } = useCategories();
const fileInput = ref<HTMLInputElement | null>(null);
const exporting = ref(false);
const importing = ref(false);
const error = ref("");
const message = ref("");
const pendingImport = ref<LibraryExport | null>(null);
const pendingFileName = ref("");

async function exportLibrary() {
  exporting.value = true;
  error.value = "";
  message.value = "";
  try {
    const data = await libraryApi.export();
    if (!import.meta.client) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `songascribe-library-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    message.value = "Library export downloaded";
  } catch (cause) {
    error.value = getApiErrorMessage(cause, "Failed to export library");
  } finally {
    exporting.value = false;
  }
}

async function chooseImport(event: Event) {
  error.value = "";
  message.value = "";
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    error.value = "Import file must be 5 MB or smaller.";
    return;
  }
  try {
    const parsed: unknown = JSON.parse(await file.text());
    if (!isLibraryExport(parsed)) throw new Error("Not a Songascribe version 1 export");
    pendingImport.value = parsed;
    pendingFileName.value = file.name;
  } catch (cause) {
    error.value = getApiErrorMessage(cause, "Import file is not valid JSON");
  }
}
function isLibraryExport(value: unknown): value is LibraryExport {
  return !!value && typeof value === "object" && (value as { version?: unknown }).version === 1 && Array.isArray((value as { categories?: unknown }).categories);
}
function cancelImport() {
  pendingImport.value = null;
  pendingFileName.value = "";
}
async function importLibrary() {
  if (!pendingImport.value) return;
  importing.value = true;
  error.value = "";
  try {
    const result = await libraryApi.import(pendingImport.value);
    await refresh();
    message.value = `Imported ${result.imported.categories} categories, ${result.imported.items} items, and ${result.imported.tracks} tracks.`;
    cancelImport();
  } catch (cause) {
    error.value = getApiErrorMessage(cause, "Failed to import library");
  } finally {
    importing.value = false;
  }
}
</script>
