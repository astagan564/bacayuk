import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/admin')({ component: RoutePlaceholder });

function RoutePlaceholder() {
  return null;
}
