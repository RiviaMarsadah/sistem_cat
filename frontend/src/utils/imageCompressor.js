export const compressImageToWebP = (file) => {
  return new Promise((resolve, reject) => {
    if (file.size > 3 * 1024 * 1024) {
      return reject(new Error('Ukuran file maksimal adalah 3 MB'));
    }
    
    let quality = 0.85;
    if (file.size > 2 * 1024 * 1024) {
      quality = 0.55;
    } else if (file.size > 1 * 1024 * 1024) {
      quality = 0.70;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Downscale untuk mengoptimalkan waktu unduhan di aplikasi siswa
        const maxDimension = 1200;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (!blob) {
            return reject(new Error('Gagal melakukan kompresi gambar'));
          }
          const compressedFile = new File([blob], `${Date.now()}.webp`, {
            type: 'image/webp'
          });
          const previewUrl = URL.createObjectURL(blob);
          resolve({ compressedFile, previewUrl });
        }, 'image/webp', quality);
      };
      img.onerror = () => reject(new Error('Gagal memuat gambar'));
    };
    reader.onerror = () => reject(new Error('Gagal membaca file'));
  });
};
