import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/settings')({ component: RoutePlaceholder });

function RoutePlaceholder() {
  return null;
}
