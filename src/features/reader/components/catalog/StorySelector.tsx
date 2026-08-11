import { CatalogPromoBanner } from '@/features/reader/components/catalog/CatalogPromoBanner';
import { EmptyStoryCollection } from '@/features/reader/components/catalog/EmptyStoryCollection';
import { PersonalLibraryTabs } from '@/features/reader/components/catalog/PersonalLibraryTabs';
import { StoryCatalogCard } from '@/features/reader/components/catalog/StoryCatalogCard';
import { StoryCatalogHero } from '@/features/reader/components/catalog/StoryCatalogHero';
import { StoryCategoryFilter } from '@/features/reader/components/catalog/StoryCategoryFilter';
import { STORY_SPINE_PALETTE } from '@/features/reader/helpers/storyCatalog';
import { useStoryCatalogController } from '@/features/reader/hooks/useStoryCatalogController';
import type { StorySelectorProps } from '@/features/reader/types/storyCatalog';

export function StorySelector(props: StorySelectorProps) {
  const controller = useStoryCatalogController({
    stories: props.stories,
    bookmarks: props.bookmarks,
    completedStories: props.completedStories,
    readingTimes: props.readingTimes,
    favoriteStoryIds: props.favoriteStoryIds,
    recentStoryIds: props.recentStoryIds,
  });

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-7 text-primary">
      <CatalogPromoBanner settings={controller.adminSettings} />
      <StoryCatalogHero
        controller={controller}
        onSelectStory={props.onSelectStory}
        onOpenStoryMaker={props.onOpenStoryMaker}
        onOpenStatsModal={props.onOpenStatsModal}
        onTestRestReminder={props.onTestRestReminder}
      />
      <PersonalLibraryTabs controller={controller} />
      <StoryCategoryFilter
        selectedCategory={controller.selectedCategory}
        onSelectCategory={controller.selectCategory}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {controller.filteredStories.map((story, index) => (
          <StoryCatalogCard
            key={story.id}
            story={story}
            progress={controller.progressForStory(story)}
            readingSeconds={props.readingTimes?.[story.id] || 0}
            spineColor={STORY_SPINE_PALETTE[index % STORY_SPINE_PALETTE.length]}
            isFavorite={controller.isFavorite(story.id)}
            isVipUser={controller.isVipUser}
            hasDownloadAccess={controller.hasDownloadAccess(story.id)}
            defaultEbookPrice={controller.adminSettings.defaultEbookPrice}
            onSelectStory={props.onSelectStory}
            onToggleFavorite={props.onToggleFavorite}
            onOpenPaymentModal={props.onOpenPaymentModal}
            onOpenOfflineDownloadModal={props.onOpenOfflineDownloadModal}
          />
        ))}
      </div>

      {controller.filteredStories.length === 0 && (
        <EmptyStoryCollection onShowAllStories={controller.showAllStories} />
      )}
    </section>
  );
}
