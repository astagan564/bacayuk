import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/costs')({ component: RoutePlaceholder });

function RoutePlaceholder() {
  return null;
}
