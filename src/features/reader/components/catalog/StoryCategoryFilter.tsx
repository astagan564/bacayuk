interface StoryCategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export function StoryCategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
}: StoryCategoryFilterProps) {
  return (
    <nav className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none" aria-label="Filter kategori cerita">
      {categories.map((category) => {
        const isActive = selectedCategory === category;
        return (
          <button
            type="button"
            key={category}
            onClick={() => onSelectCategory(category)}
            aria-pressed={isActive}
            className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold transition-all ${
              isActive
                ? 'bg-primary text-inverse shadow-sm'
                : 'bg-surface text-secondary hover:bg-surface-hover'
            }`}
          >
            {category}
          </button>
        );
      })}
    </nav>
  );
}
