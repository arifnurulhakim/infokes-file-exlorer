<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import type { FolderTreeNode, Folder, FileEntry, FileSearchResult } from "@shared/types";
import { useFolderApi } from "./composables/useFolderApi";
import FolderTree from "./components/FolderTree.vue";
import FolderContents from "./components/FolderContents.vue";
import IconFolderOpen from "./components/icons/IconFolderOpen.vue";
import IconSearch from "./components/icons/IconSearch.vue";
import IconAlert from "./components/icons/IconAlert.vue";
import IconFile from "./components/icons/IconFile.vue";

const { getTree, getChildren, searchFiles } = useFolderApi();

const tree = ref<FolderTreeNode[]>([]);
const selectedId = ref<number | null>(null);
const subfolders = ref<Folder[]>([]);
const fileList = ref<FileEntry[]>([]);
const error = ref<string | null>(null);
const searchQuery = ref("");
const loadingChildren = ref(false);
const fileResults = ref<FileSearchResult[]>([]);

let searchDebounce: ReturnType<typeof setTimeout> | undefined;
watch(searchQuery, (q) => {
  clearTimeout(searchDebounce);
  if (!q.trim()) {
    fileResults.value = [];
    return;
  }
  searchDebounce = setTimeout(async () => {
    try {
      fileResults.value = await searchFiles(q);
    } catch (e) {
      error.value = (e as Error).message;
    }
  }, 250);
});

function selectFileResult(result: FileSearchResult) {
  onSelect(result.folderId);
}

function findNode(nodes: FolderTreeNode[], id: number): FolderTreeNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNode(node.children, id);
    if (found) return found;
  }
  return null;
}

const selectedName = computed(() => {
  if (selectedId.value === null) return null;
  return findNode(tree.value, selectedId.value)?.name ?? null;
});

function findPath(nodes: FolderTreeNode[], id: number, path: number[] = []): number[] | null {
  for (const node of nodes) {
    if (node.id === id) return [...path, node.id];
    const found = findPath(node.children, id, [...path, node.id]);
    if (found) return found;
  }
  return null;
}

const expandPath = computed(() => {
  if (selectedId.value === null) return [];
  return findPath(tree.value, selectedId.value) ?? [];
});

onMounted(async () => {
  try {
    tree.value = await getTree();
  } catch (e) {
    error.value = (e as Error).message;
  }
});

async function onSelect(id: number) {
  selectedId.value = id;
  loadingChildren.value = true;
  try {
    const data = await getChildren(id);
    subfolders.value = data.subfolders;
    fileList.value = data.files;
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    loadingChildren.value = false;
  }
}
</script>

<template>
  <div class="window">
    <header class="title-bar">
      <IconFolderOpen class="title-icon" />
      <span class="title-text">Windows Explorer Clone</span>
    </header>
    <div class="explorer">
      <aside class="left-panel">
        <div class="search-box">
          <IconSearch class="search-icon" />
          <input v-model="searchQuery" class="search-input" type="text" placeholder="Search folders..." />
        </div>
        <p v-if="error" class="error"><IconAlert class="error-icon" /> {{ error }}</p>
        <FolderTree :nodes="tree" :selected-id="selectedId" :query="searchQuery" :expand-path="expandPath" @select="onSelect" />
        <div v-if="searchQuery && fileResults.length > 0" class="file-results">
          <p class="file-results-title">Files</p>
          <div
            v-for="result in fileResults"
            :key="result.id"
            class="file-result"
            @click="selectFileResult(result)"
          >
            <IconFile class="file-result-icon" />
            <div class="file-result-text">
              <span class="file-result-name">{{ result.name }}</span>
              <span class="file-result-path">{{ result.folderName }}</span>
            </div>
          </div>
        </div>
        <p v-else-if="searchQuery && fileResults.length === 0" class="no-results">No files match "{{ searchQuery }}".</p>
      </aside>
      <main class="right-panel">
        <div class="path-bar">{{ selectedName ?? "This PC" }}</div>
        <div class="contents-area">
          <p v-if="loadingChildren" class="hint">Loading…</p>
          <FolderContents
            v-else
            :folders="subfolders"
            :files="fileList"
            :has-selection="selectedId !== null"
            @open="onSelect"
          />
        </div>
      </main>
    </div>
  </div>
</template>

<style>
* {
  box-sizing: border-box;
}
body {
  margin: 0;
  font-family: "Segoe UI", system-ui, sans-serif;
  font-size: 14px;
  color: #1f1f1f;
}
.window {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
.title-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #f3f3f3;
  border-bottom: 1px solid #d0d0d0;
  font-weight: 600;
}
.title-icon {
  width: 18px;
  height: 18px;
  color: #5a9fd4;
}
.explorer {
  display: flex;
  flex: 1;
  min-height: 0;
}
.left-panel {
  width: 280px;
  flex-shrink: 0;
  overflow-y: auto;
  border-right: 1px solid #e0e0e0;
  padding: 10px;
  background: #fafafa;
}
.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.path-bar {
  padding: 8px 14px;
  border-bottom: 1px solid #e0e0e0;
  background: #fcfcfc;
  font-size: 13px;
  color: #555;
}
.contents-area {
  flex: 1;
  overflow-y: auto;
  padding: 8px 14px;
}
.error {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #c0392b;
}
.error-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}
.hint {
  color: #888;
  padding: 8px 0;
}
.search-box {
  position: relative;
  margin-bottom: 10px;
}
.search-icon {
  position: absolute;
  left: 9px;
  top: 50%;
  transform: translateY(-50%);
  width: 14px;
  height: 14px;
  color: #999;
  pointer-events: none;
}
.search-input {
  width: 100%;
  padding: 7px 10px 7px 30px;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
  font-size: 13px;
  background: #fff;
}
.search-input:focus {
  outline: none;
  border-color: #0078d4;
  box-shadow: 0 0 0 2px rgba(0, 120, 212, 0.15);
}
.file-results {
  margin-top: 10px;
  border-top: 1px solid #e5e5e5;
  padding-top: 8px;
}
.file-results-title {
  margin: 0 0 4px;
  padding: 0 6px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #999;
}
.file-result {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 6px;
  border-radius: 4px;
  cursor: pointer;
}
.file-result:hover {
  background: #ececec;
}
.file-result-icon {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
  color: #9a9a9a;
}
.file-result-text {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.file-result-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.file-result-path {
  font-size: 11px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.no-results {
  color: #888;
  padding: 8px 6px;
  font-size: 13px;
}
</style>
