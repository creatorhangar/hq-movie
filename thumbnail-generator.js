/* ═══════════════════════════════════════════════════════════════
   PROJECT THUMBNAIL GENERATOR
   Generates 200x150px JPEG thumbnails (<20KB) for dashboard preview
   Mobile-optimized with adaptive quality (50% mobile, 60% desktop)
   ═══════════════════════════════════════════════════════════════ */

const ThumbnailGenerator = {
  // Throttle: max 1 thumbnail generation at a time
  _generating: false,
  _queue: [],
  
  /**
   * Generate thumbnail for a project
   * @param {Object} project - Project object
   * @returns {Promise<string|null>} - Data URL or null
   */
  async generate(project) {
    if (!project || !project.pages || project.pages.length === 0) return null;
    
    // Throttle concurrent generations
    if (this._generating) {
      return new Promise((resolve) => {
        this._queue.push({ project, resolve });
      });
    }
    
    this._generating = true;
    
    try {
      const result = await this._doGenerate(project);
      return result;
    } finally {
      this._generating = false;
      // Process next in queue
      if (this._queue.length > 0) {
        const next = this._queue.shift();
        this.generate(next.project).then(next.resolve);
      }
    }
  },
  
  async _doGenerate(project) {
    // Find first image from pages
    const firstImage = this._findFirstImage(project);
    if (!firstImage) return null;
    
    try {
      // Detect device for adaptive quality
      const isMobile = window.innerWidth <= 768;
      const quality = isMobile ? 0.5 : 0.6;
      const width = 200;
      const height = 150;
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      // Load image
      const img = await this._loadImage(firstImage);
      
      // Draw with cover fit (fill without distortion)
      this._drawCoverFit(ctx, img, width, height);
      
      // Convert to JPEG with adaptive quality
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      
      return dataUrl;
    } catch (err) {
      console.warn('Thumbnail generation failed:', err);
      return null;
    }
  },
  
  /**
   * Generate thumbnails for all projects that don't have one
   * Called on dashboard load for migration
   * @param {Array} projects - Array of project objects
   * @returns {Promise<number>} - Number of thumbnails generated
   */
  async migrateAll(projects) {
    if (!projects || !Array.isArray(projects)) return 0;
    
    let count = 0;
    const needsThumbnail = projects.filter(p => !p.thumbnail);
    
    for (const project of needsThumbnail) {
      try {
        const thumb = await this.generate(project);
        if (thumb) {
          project.thumbnail = thumb;
          // Persist to IndexedDB
          if (typeof db !== 'undefined' && db.projects) {
            await db.projects.put(structuredClone(project));
          }
          count++;
        }
        // Small delay between generations to prevent UI blocking
        await new Promise(r => setTimeout(r, 100));
      } catch (e) {
        console.warn('Migration failed for project:', project.id, e);
      }
    }
    
    return count;
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
