type CategoryNode = {
  name: string;
  children?: CategoryNode[];
};

export function getLeafCategory(category: CategoryNode): string {
  if (!category) return "";

  if (!category.children || category.children.length === 0) {
    return category.name ?? "";
  }

  return getLeafCategory(category.children[category.children.length - 1]);
}