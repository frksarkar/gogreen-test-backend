type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  parent: string | null;
  children: CategoryNode[];
};
type FlatCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  parentId: string | null;
};

export const buildCategoryTree = (
  categories: FlatCategory[],
  parentId: string | null = null
): CategoryNode[] => {
  return categories
    .filter((c) => c.parentId === parentId)
    .map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description ?? null,
      image: c.image ?? null,
      parent: parentId,
      children: buildCategoryTree(categories, c.id), 
    }));
};