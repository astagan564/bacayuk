import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/admin/users')({ component: RoutePlaceholder });

function RoutePlaceholder() {
  return null;
}
