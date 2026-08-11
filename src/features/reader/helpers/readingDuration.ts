export function formatReadingDuration(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return '0 dtk';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours} jam ${minutes} mnt`;
  if (minutes > 0) return `${minutes} mnt ${seconds} dtk`;
  return `${seconds} dtk`;
}
