import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/stories/$storyId/canvas')({ component: RoutePlaceholder });

function RoutePlaceholder() {
  return null;
}
