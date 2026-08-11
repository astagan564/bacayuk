import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/finance')({ component: RoutePlaceholder });

function RoutePlaceholder() {
  return null;
}
