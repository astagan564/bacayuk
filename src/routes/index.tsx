import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({ component: RoutePlaceholder });

function RoutePlaceholder() {
  return null;
}
