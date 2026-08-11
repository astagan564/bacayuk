export function revokeAudioBlobUrl(url: string | null): void {
  if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
}
