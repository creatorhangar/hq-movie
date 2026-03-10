/* ═══════════════════════════════════════════════════════════════
   PROJECT THUMBNAIL GENERATOR
   Generates 200x150px JPEG thumbnails (<20KB) for dashboard preview
   ═══════════════════════════════════════════════════════════════ */

const ThumbnailGenerator = {
  /**
   * Generate thumbnail for a project
   * @param {Object} project - Project object
   * @returns {Promise<string|null>} - Data URL or null
   */
  async generate(project) {
    if (!project || !project.pages || project.pages.length === 0) return null;
    
    // Find first image from pages
    const firstImage = this._findFirstImage(project);
    if (!firstImage) return null;
    
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 150;
      const ctx = canvas.getContext('2d');
      
      // Load image
      const img = await this._loadImage(firstImage);
      
      // Draw with cover fit (fill without distortion)
      this._drawCoverFit(ctx, img, 200, 150);
      
      // Convert to JPEG with quality 60% (target <20KB)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
      
      return dataUrl;
    } catch (err) {
      console.warn('Thumbnail generation failed:', err);
      return null;
    }
  },
  
  _findFirstImage(project) {
    // Check cover first
    if (project.cover && project.cover.backgroundImage) {
      return project.cover.backgroundImage;
    }
    
    // Check pages
    for (const page of project.pages) {
      // Check panels
      if (page.panels) {
        for (const panel of page.panels) {
          if (panel.image && panel.image.src) {
            return panel.image.src;
          }
        }
      }
      
      // Check slides (slideshow mode)
      if (page.slides) {
        for (const slide of page.slides) {
          if (slide.image && slide.image.src) {
            return slide.image.src;
          }
        }
      }
    }
    
    return null;
  },
  
  _loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  },
  
  _drawCoverFit(ctx, img, targetW, targetH) {
    const imgRatio = img.width / img.height;
    const targetRatio = targetW / targetH;
    
    let drawW, drawH, offsetX, offsetY;
    
    if (imgRatio > targetRatio) {
      // Image wider than target
      drawH = targetH;
      drawW = img.width * (targetH / img.height);
      offsetX = -(drawW - targetW) / 2;
      offsetY = 0;
    } else {
      // Image taller than target
      drawW = targetW;
      drawH = img.height * (targetW / img.width);
      offsetX = 0;
      offsetY = -(drawH - targetH) / 2;
    }
    
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, targetW, targetH);
    ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
  }
};
