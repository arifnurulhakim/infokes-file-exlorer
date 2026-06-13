import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import type { FolderTreeNode as FolderTreeNodeType } from "@shared/types";
import FolderTreeNode from "./FolderTreeNode.vue";

const leafNode: FolderTreeNodeType = {
  id: 1,
  name: "Leaf",
  parentId: null,
  children: [],
};

const nodeWithChildren: FolderTreeNodeType = {
  id: 1,
  name: "Documents",
  parentId: null,
  children: [
    { id: 2, name: "Work", parentId: 1, children: [] },
    { id: 3, name: "Personal", parentId: 1, children: [] },
  ],
};

describe("FolderTreeNode", () => {
  it("renders the folder name", () => {
    const wrapper = mount(FolderTreeNode, {
      props: { node: leafNode, selectedId: null },
    });

    expect(wrapper.text()).toContain("Leaf");
  });

  it("does not show a toggle for folders without children", () => {
    const wrapper = mount(FolderTreeNode, {
      props: { node: leafNode, selectedId: null },
    });

    expect(wrapper.find(".toggle").exists()).toBe(false);
    expect(wrapper.find(".toggle-spacer").exists()).toBe(true);
  });

  it("emits select with the folder id when clicked", async () => {
    const wrapper = mount(FolderTreeNode, {
      props: { node: leafNode, selectedId: null },
    });

    await wrapper.find(".folder-row").trigger("click");

    expect(wrapper.emitted("select")).toEqual([[1]]);
  });

  it("applies the selected class when selectedId matches", () => {
    const wrapper = mount(FolderTreeNode, {
      props: { node: leafNode, selectedId: 1 },
    });

    expect(wrapper.find(".folder-row").classes()).toContain("selected");
  });

  it("toggles children visibility when clicking the toggle, without emitting select", async () => {
    const wrapper = mount(FolderTreeNode, {
      props: { node: nodeWithChildren, selectedId: null },
    });

    // collapsed by default
    expect(wrapper.findAll(".children .folder-row")).toHaveLength(0);

    await wrapper.find(".toggle").trigger("click");

    expect(wrapper.findAll(".children .folder-row")).toHaveLength(2);
    expect(wrapper.emitted("select")).toBeUndefined();
  });

  it("bubbles up select events emitted by child nodes", async () => {
    const wrapper = mount(FolderTreeNode, {
      props: { node: nodeWithChildren, selectedId: null },
    });

    await wrapper.find(".toggle").trigger("click");
    const childRows = wrapper.findAll(".children .folder-row");
    await childRows[0].trigger("click");

    expect(wrapper.emitted("select")).toEqual([[2]]);
  });

  it("auto-expands and highlights a matching descendant when searching", () => {
    const wrapper = mount(FolderTreeNode, {
      props: { node: nodeWithChildren, selectedId: null, query: "Work" },
    });

    const names = wrapper.findAll(".name").map((n) => n.text());
    expect(names).toEqual(["Documents", "Work"]);
    expect(wrapper.find(".name.match").text()).toBe("Work");
  });
});
