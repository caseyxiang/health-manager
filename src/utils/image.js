// 图片压缩工具

/**
 * 压缩图片
 * @param {string} base64Data - 原始base64图片数据
 * @param {number} maxWidth - 最大宽度 (默认800px)
 * @param {number} quality - 压缩质量 0-1 (默认0.7)
 * @returns {Promise<string>} - 压缩后的base64图片
 */
export const compressImage = (base64Data, maxWidth = 800, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // 计算压缩后的尺寸
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      // 创建canvas进行压缩
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // 转换为压缩后的base64
      const compressedData = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedData);
    };

    img.onerror = (error) => {
      console.error('图片加载失败:', error);
      reject(error);
    };

    img.src = base64Data;
  });
};

/**
 * 批量压缩图片
 * @param {Array} files - 文件数组 [{name, data, type}]
 * @param {number} maxWidth - 最大宽度
 * @param {number} quality - 压缩质量
 * @returns {Promise<Array>} - 压缩后的文件数组
 */
export const compressImages = async (files, maxWidth = 800, quality = 0.7) => {
  const compressedFiles = [];

  for (const file of files) {
    try {
      const compressedData = await compressImage(file.data, maxWidth, quality);
      compressedFiles.push({
        name: file.name,
        data: compressedData,
        type: 'image/jpeg'
      });
    } catch (error) {
      console.error(`压缩图片 ${file.name} 失败:`, error);
      // 如果压缩失败，保留原图
      compressedFiles.push(file);
    }
  }

  return compressedFiles;
};
