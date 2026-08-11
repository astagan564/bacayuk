import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/stories')({ component: RoutePlaceholder });

function RoutePlaceholder() {
  return null;
}
