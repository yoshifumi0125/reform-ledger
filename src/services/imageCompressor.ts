/**
 * スマートフォンで撮影した大容量画像（10MB〜30MB）を、
 * AI解析に最適なサイズ（800KB以下、最大長辺1200px）に
 * ブラウザのCanvasを使って高速圧縮するユーティリティ
 */
export async function compressImage(file: File, maxDimension = 1200, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // 長辺が maxDimension を超える場合はアスペクト比を維持して縮小
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context is not available'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // JPEG形式で圧縮したBase64 DataURLを生成
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * 複数画像の一括並列圧縮
 */
export async function compressImages(files: File[], maxDimension = 1200, quality = 0.7): Promise<string[]> {
  return Promise.all(files.map((file) => compressImage(file, maxDimension, quality)));
}
