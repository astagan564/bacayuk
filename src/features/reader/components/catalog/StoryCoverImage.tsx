import { useState } from 'react';
import type { Story } from '@/types';

interface StoryCoverImageProps {
  story: Story;
}

export function StoryCoverImage({ story }: StoryCoverImageProps) {
  const [failedToLoad, setFailedToLoad] = useState(false);
  const coverImage = story.coverImage?.trim();

  if (!coverImage || failedToLoad) return null;

  return (
    <>
      <img
        src={coverImage}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full scale-110 object-cover opacity-55 blur-xl"
        onError={() => setFailedToLoad(true)}
      />
      <img
        src={coverImage}
        alt={`Sampul buku ${story.title}`}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-contain"
        onError={() => setFailedToLoad(true)}
      />
    </>
  );
}
