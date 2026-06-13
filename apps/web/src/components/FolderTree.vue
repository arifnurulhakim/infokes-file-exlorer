<script setup lang="ts">
import { computed } from "vue";
import type { FolderTreeNode } from "@shared/types";
import { treeMatches } from "@shared/types";
import FolderTreeNodeComp from "./FolderTreeNode.vue";

const props = defineProps<{
  nodes: FolderTreeNode[];
  selectedId: number | null;
  query?: string;
  expandPath?: number[];
}>();

const emit = defineEmits<{ select: [id: number] }>();

const visibleNodes = computed(() =>
  props.nodes.filter((node) => treeMatches(node, props.query ?? ""))
);
</script>

<template>
  <div class="folder-tree">
    <p v-if="query && visibleNodes.length === 0" class="no-results">No folders match "{{ query }}".</p>
    <FolderTreeNodeComp
      v-for="node in visibleNodes"
      :key="node.id"
      :node="node"
      :selected-id="selectedId"
      :query="query"
      :expand-path="expandPath"
      @select="(id) => emit('select', id)"
    />
  </div>
</template>

<style scoped>
.no-results {
  color: #888;
  padding: 8px;
  font-size: 14px;
}
</style>
