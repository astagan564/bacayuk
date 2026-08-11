import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/stories/new')({ component: RoutePlaceholder });

function RoutePlaceholder() {
  return null;
}
