import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/read/$storyId')({ component: RoutePlaceholder });

function RoutePlaceholder() {
  return null;
}
