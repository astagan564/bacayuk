export function saveBlobToDevice(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function createDownloadFilename(title: string, suffix: string): string {
  const cleanTitle = title.replace(/[^a-zA-Z0-9]/g, '_');
  return `${cleanTitle}_${suffix}`;
}
