// src/lib/imageUtils.ts
export function compressImage(
    file: File,
    maxWidth: number,
    maxHeight: number,
    quality: number = 0.8
): Promise<string> {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/')) {
            reject(new Error('Wybierz plik graficzny'));
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            reject(new Error('Plik jest za duży (max 5MB)'));
            return;
        }

        const reader = new FileReader();

        reader.onload = (event) => {
            const img = document.createElement('img');

            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Canvas context not available'));
                    return;
                }

                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL('image/webp', quality);
                resolve(dataUrl);
            };

            img.onerror = () => reject(new Error('Nie udało się załadować obrazka'));
            img.src = event.target?.result as string;
        };

        reader.onerror = () => reject(new Error('Nie udało się odczytać pliku'));
        reader.readAsDataURL(file);
    });
}