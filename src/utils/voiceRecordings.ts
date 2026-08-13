// Utility for storing and retrieving parent/child custom voice narration per story page using IndexedDB
const DB_NAME = 'BukuCeritaVoiceRecordingsDB';
const STORE_NAME = 'recordings';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

export const voiceRecordingsStore = {
  async saveRecording(storyId: string, pageNumber: number, audioBlob: Blob): Promise<string> {
    const key = `${storyId}_page_${pageNumber}`;
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(audioBlob, key);
        req.onsuccess = () => {
          const url = URL.createObjectURL(audioBlob);
          resolve(url);
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Fallback to localStorage using DataURL if IndexedDB fails
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          try {
            localStorage.setItem(`buku_cerita_vrec_${key}`, base64);
            resolve(base64);
          } catch (e) {
            reject(e);
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });
    }
  },

  async getRecordingUrl(storyId: string, pageNumber: number): Promise<string | null> {
    const key = `${storyId}_page_${pageNumber}`;
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => {
          const res = req.result;
          if (res instanceof Blob) {
            resolve(URL.createObjectURL(res));
          } else {
            // Check fallback
            const fallback = localStorage.getItem(`buku_cerita_vrec_${key}`);
            resolve(fallback || null);
          }
        };
        req.onerror = () => {
          const fallback = localStorage.getItem(`buku_cerita_vrec_${key}`);
          resolve(fallback || null);
        };
      });
    } catch {
      const fallback = localStorage.getItem(`buku_cerita_vrec_${key}`);
      return fallback || null;
    }
  },

  async deleteRecording(storyId: string, pageNumber: number): Promise<void> {
    const key = `${storyId}_page_${pageNumber}`;
    try {
      localStorage.removeItem(`buku_cerita_vrec_${key}`);
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(key);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      });
    } catch {
      localStorage.removeItem(`buku_cerita_vrec_${key}`);
    }
  },

  async countRecordings(): Promise<number> {
    let fallbackCount = 0;
    for (let index = 0; index < localStorage.length; index += 1) {
      if (localStorage.key(index)?.startsWith('buku_cerita_vrec_')) fallbackCount += 1;
    }
    try {
      const db = await openDB();
      return await new Promise((resolve) => {
        const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).count();
        request.onsuccess = () => resolve(request.result + fallbackCount);
        request.onerror = () => resolve(fallbackCount);
      });
    } catch {
      return fallbackCount;
    }
  },

  async clearAll(): Promise<void> {
    const fallbackKeys: string[] = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key?.startsWith('buku_cerita_vrec_')) fallbackKeys.push(key);
    }
    fallbackKeys.forEach((key) => localStorage.removeItem(key));

    await new Promise<void>((resolve) => {
      if (!window.indexedDB) return resolve();
      const request = indexedDB.deleteDatabase(DB_NAME);
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
      request.onblocked = () => resolve();
    });
  },
};
