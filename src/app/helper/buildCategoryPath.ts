
export const buildCategoryPath: any = (
  category: any,
  categoryMap: Map<string, any>
) => {
  if (!category) return null;

  return {
    id: category.id,
    name: category.name,
    parent: category.parentId
      ? buildCategoryPath(categoryMap.get(category.parentId), categoryMap)
      : null,
  };
};