<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { FolderTreeNode } from "@shared/types";
import { treeMatches } from "@shared/types";
import IconFolder from "./icons/IconFolder.vue";
import IconFolderOpen from "./icons/IconFolderOpen.vue";
import IconChevron from "./icons/IconChevron.vue";

const props = defineProps<{
  node: FolderTreeNode;
  selectedId: number | null;
  query?: string;
  expandPath?: number[];
}>();

const emit = defineEmits<{ select: [id: number] }>();

const expanded = ref(false);
const hasChildren = props.node.children.length > 0;

const selfMatches = computed(() => {
  const q = (props.query ?? "").toLowerCase();
  return q !== "" && props.node.name.toLowerCase().includes(q);
});

const visibleChildren = computed(() =>
  props.node.children.filter((child) => treeMatches(child, props.query ?? ""))
);

// auto-expand when search has a match somewhere below this node
watch(
  () => props.query,
  (q) => {
    if (q) {
      if (visibleChildren.value.length > 0) expanded.value = true;
    }
  },
  { immediate: true }
);

watch(
  () => props.expandPath,
  (path) => {
    if (path?.includes(props.node.id) && hasChildren) expanded.value = true;
  },
  { immediate: true }
);

function toggle() {
  expanded.value = !expanded.value;
}

function select() {
  emit("select", props.node.id);
}

function onChildSelect(id: number) {
  emit("select", id);
}
</script>

<template>
  <div class="folder-node">
    <div class="folder-row" :class="{ selected: selectedId === node.id }" @click="select">
      <span v-if="hasChildren" class="toggle" @click.stop="toggle">
        <IconChevron class="icon-sm" :expanded="expanded" />
      </span>
      <span v-else class="toggle-spacer"></span>
      <component :is="expanded && hasChildren ? IconFolderOpen : IconFolder" class="icon" />
      <span class="name" :class="{ match: selfMatches }">{{ node.name }}</span>
    </div>
    <div v-if="expanded && hasChildren" class="children">
      <FolderTreeNode
        v-for="child in visibleChildren"
        :key="child.id"
        :node="child"
        :selected-id="selectedId"
        :query="query"
        :expand-path="expandPath"
        @select="onChildSelect"
      />
    </div>
  </div>
</template>

<style scoped>
.folder-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 6px;
  cursor: pointer;
  border-radius: 4px;
  user-select: none;
  white-space: nowrap;
  transition: background-color 0.1s ease;
}
.folder-row:hover {
  background: #ececec;
}
.folder-row.selected {
  background: #cfe8fc;
}
.folder-row.selected:hover {
  background: #bfe0fa;
}
.icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: #5a9fd4;
}
.icon-sm {
  width: 12px;
  height: 12px;
}
.name {
  overflow: hidden;
  text-overflow: ellipsis;
}
.name.match {
  background: #fff3a0;
  border-radius: 2px;
  padding: 0 2px;
}
.toggle,
.toggle-spacer {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
}
.children {
  margin-left: 14px;
  border-left: 1px solid #e5e5e5;
  padding-left: 6px;
}
</style>
