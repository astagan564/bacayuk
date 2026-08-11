import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/analytics')({ component: RoutePlaceholder });

function RoutePlaceholder() {
  return null;
}
