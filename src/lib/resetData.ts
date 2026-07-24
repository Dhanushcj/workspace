'use client';

export const clearLocalData = () => {
  const keysToKeep = ['forge-auth'];
  const allKeys = Object.keys(localStorage);
  
  let clearedCount = 0;
  allKeys.forEach(key => {
    if (!keysToKeep.includes(key)) {
      localStorage.removeItem(key);
      clearedCount++;
    }
  });

  // Also clear sessionStorage just in case
  sessionStorage.clear();

  console.log(`[Forge India] Cleared ${clearedCount} local data keys. Authentication preserved.`);
  return clearedCount;
};

