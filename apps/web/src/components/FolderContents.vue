<script setup lang="ts">
import type { Folder, FileEntry } from "@shared/types";
import IconFolder from "./icons/IconFolder.vue";
import IconFile from "./icons/IconFile.vue";
import IconFileImage from "./icons/IconFileImage.vue";
import IconFileDoc from "./icons/IconFileDoc.vue";
import IconFilePdf from "./icons/IconFilePdf.vue";
import IconFileArchive from "./icons/IconFileArchive.vue";
import IconFileCode from "./icons/IconFileCode.vue";

defineProps<{
  folders: Folder[];
  files: FileEntry[];
  hasSelection: boolean;
}>();

const emit = defineEmits<{ open: [id: number] }>();

const ext = (name: string) => name.split(".").pop()?.toLowerCase() ?? "";

const IMAGE_EXT = ["jpg", "jpeg", "png", "gif", "svg", "webp", "bmp"];
const DOC_EXT = ["doc", "docx", "txt", "md", "rtf"];
const PDF_EXT = ["pdf"];
const ARCHIVE_EXT = ["zip", "rar", "7z", "tar", "gz"];
const CODE_EXT = ["js", "ts", "json", "html", "css", "vue", "py", "java"];

function fileIcon(name: string) {
  const e = ext(name);
  if (IMAGE_EXT.includes(e)) return IconFileImage;
  if (PDF_EXT.includes(e)) return IconFilePdf;
  if (DOC_EXT.includes(e)) return IconFileDoc;
  if (ARCHIVE_EXT.includes(e)) return IconFileArchive;
  if (CODE_EXT.includes(e)) return IconFileCode;
  return IconFile;
}

function fileIconClass(name: string) {
  const e = ext(name);
  if (IMAGE_EXT.includes(e)) return "icon-image";
  if (PDF_EXT.includes(e)) return "icon-pdf";
  if (DOC_EXT.includes(e)) return "icon-doc";
  if (ARCHIVE_EXT.includes(e)) return "icon-archive";
  if (CODE_EXT.includes(e)) return "icon-code";
  return "icon-file";
}

function formatSize(bytes: number | null): string {
  if (bytes === null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
</script>

<template>
  <div class="folder-contents">
    <p v-if="!hasSelection" class="hint">Pilih folder di panel kiri untuk melihat isinya.</p>
    <p v-else-if="folders.length === 0 && files.length === 0" class="hint">Folder ini kosong.</p>
    <ul v-else class="items">
      <li v-for="folder in folders" :key="`folder-${folder.id}`" class="item item-folder" @click="emit('open', folder.id)">
        <IconFolder class="icon icon-folder" />
        <span class="name">{{ folder.name }}</span>
      </li>
      <li v-for="file in files" :key="`file-${file.id}`" class="item">
        <component :is="fileIcon(file.name)" class="icon" :class="fileIconClass(file.name)" />
        <span class="name">{{ file.name }}</span>
        <span class="size">{{ formatSize(file.sizeBytes) }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.items {
  list-style: none;
  padding: 0;
  margin: 0;
}
.item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 6px;
}
.item:hover {
  background: #f0f0f0;
}
.item-folder {
  cursor: pointer;
}
.icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}
.icon-folder {
  color: #5a9fd4;
}
.icon-file {
  color: #9a9a9a;
}
.icon-pdf {
  color: #d6483a;
}
.icon-image {
  color: #4caf7d;
}
.icon-doc {
  color: #3a7bd6;
}
.icon-archive {
  color: #b08a3e;
}
.icon-code {
  color: #8b5cf6;
}
.name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}
.size {
  color: #888;
  font-size: 12px;
  flex-shrink: 0;
}
.hint {
  color: #888;
  padding: 12px 0;
}
</style>
