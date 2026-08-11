import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Story } from '@/types';
import { storyStore } from '@/utils/storyStore';

export interface StoryCollectionController {
  stories: Story[];
  setStories: Dispatch<SetStateAction<Story[]>>;
}

export function useStoryCollection(): StoryCollectionController {
  const [stories, setStories] = useState<Story[]>(() => storyStore.getLocalStories());

  useEffect(() => {
    let isMounted = true;
    void storyStore.loadStories().then((loadedStories) => {
      if (isMounted) setStories(loadedStories);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return { stories, setStories };
}
