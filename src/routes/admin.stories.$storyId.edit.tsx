import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/stories/$storyId/edit')({ component: RoutePlaceholder });

function RoutePlaceholder() {
  return null;
}
