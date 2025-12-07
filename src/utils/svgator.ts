/**
 * SVGator Controller Utility
 * Manages SVGator animated SVGs and their integration with video players
 */

interface SVGatorPlayer {
  ready(callback: () => void): void;
  play(): void;
  pause(): void;
  stop(): void;
  restart(): void;
  seek(time: number): void;
  getTotalTime(): number;
  getCurrentTime(): number;
  on(event: string, callback: (data?: any) => void): void;
  off(event: string, callback: (data?: any) => void): void;
}

interface SVGatorInstance {
  id: string;
  element: HTMLObjectElement | SVGSVGElement;
  player: SVGatorPlayer | null;
  type: 'object' | 'inline';
  isReady: boolean;
}

export type InteractiveMode = 'sync' | 'independent' | 'controller';

export class SVGatorController {
  private instances: Map<string, SVGatorInstance> = new Map();
  private scriptLoaded: boolean = false;
  private scriptLoadPromise: Promise<void> | null = null;

  /**
   * Load the SVGator player script if not already loaded
   */
  async loadScript(): Promise<void> {
    if (this.scriptLoaded) return;
    if (this.scriptLoadPromise) return this.scriptLoadPromise;

    this.scriptLoadPromise = new Promise((resolve, reject) => {
      // Check if SVGatorPlayer is already available (from programmatic export)
      if (typeof (window as any).SVGatorPlayer !== 'undefined') {
        console.log('✅ SVGatorPlayer already available (programmatic export)');
        this.scriptLoaded = true;
        resolve();
        return;
      }

      // Try loading from CDN (for non-programmatic exports)
      console.log('📦 Loading SVGator player from CDN...');
      const script = document.createElement('script');
      script.src = 'https://cdn.svgator.com/ply/latest/player.js';
      script.async = true;
      
      script.onload = () => {
        console.log('✅ SVGator player loaded from CDN');
        this.scriptLoaded = true;
        resolve();
      };
      
      script.onerror = () => {
        console.warn('⚠️ Failed to load SVGator player from CDN, checking if programmatic export...');
        this.scriptLoadPromise = null;
        
        // Wait a bit and check again if SVGatorPlayer became available (programmatic export might load later)
        setTimeout(() => {
          if (typeof (window as any).SVGatorPlayer !== 'undefined') {
            console.log('✅ SVGatorPlayer found (programmatic export loaded)');
            this.scriptLoaded = true;
            resolve();
          } else {
            console.warn('⚠️ CDN player not available. This is expected for embedded players.');
            reject(new Error('CDN player not available. This is expected for embedded players.'));
          }
        }, 1000);
      };

      document.head.appendChild(script);
    });

    return this.scriptLoadPromise;
  }

  /**
   * Register an SVGator instance (object or inline SVG)
   */
  async register(id: string, element: HTMLObjectElement | SVGSVGElement): Promise<SVGatorInstance> {
    const type = element.tagName.toLowerCase() === 'object' ? 'object' : 'inline';
    const instance: SVGatorInstance = {
      id,
      element,
      player: null,
      type,
      isReady: false
    };

    this.instances.set(id, instance);

    // Initialize the player (will check for embedded player first)
    await this.initializePlayer(instance);

    // Only load CDN script if no embedded player was found
    if (!instance.player) {
      console.log('🎨 No embedded player found, trying CDN...');
      try {
        await this.loadScript();
        // Try initializing again with CDN player
        await this.initializePlayer(instance);
      } catch (error) {
        console.log('ℹ️ CDN player not available, but embedded player may initialize later');
      }
    }

    return instance;
  }

  /**
   * Initialize the SVGator player for an instance
   */
  private async initializePlayer(instance: SVGatorInstance): Promise<void> {
    return new Promise((resolve) => {
      // For object tags, wait for the object to load
      if (instance.type === 'object') {
        const obj = instance.element as HTMLObjectElement;
        
        const initPlayer = () => {
          try {
            const svgDoc = obj.contentDocument;
            if (!svgDoc) {
              console.warn(`Cannot access content document for object #${instance.id}`);
              resolve();
              return;
            }
            
            const svg = svgDoc.querySelector('svg');
            if (!svg) {
              console.warn(`No SVG found in object #${instance.id}`);
              resolve();
              return;
            }
            
            console.log('🎨 SVG found, checking for SVGator player...');
            
            // Check for embedded player via __SVGATOR_PLAYER__ global
            const checkEmbeddedPlayer = () => {
              // Check in the object's window first (where embedded players register)
              const objWindow = (obj.contentWindow as any);
              const objGlobalPlayer = objWindow?.__SVGATOR_PLAYER__;
              
              if (objGlobalPlayer && objGlobalPlayer[instance.id]) {
                console.log('✅ Embedded player found in object window __SVGATOR_PLAYER__["' + instance.id + '"]!');
                const playerFactory = objGlobalPlayer[instance.id];
                
                // Check if the SVG already has a player attached via svgatorPlayer property
                const existingPlayer = (svg as any).svgatorPlayer;
                if (existingPlayer) {
                  console.log('✅ Using existing player from svg.svgatorPlayer');
                  instance.player = existingPlayer;
                  instance.isReady = true;
                  resolve();
                  return true;
                }
                
                console.log('🔍 Player factory type:', typeof playerFactory);
                console.log('🔍 Checking for svgatorPlayer property...');
                
                // Wait a bit more for the player to attach
                setTimeout(() => {
                  const attachedPlayer = (svg as any).svgatorPlayer;
                  if (attachedPlayer) {
                    console.log('✅ Player attached after wait!');
                    instance.player = attachedPlayer;
                    instance.isReady = true;
                    resolve();
                  } else {
                    console.warn('⚠️ Embedded player factory found but no player attached to SVG');
                    resolve();
                  }
                }, 200);
                return true;
              }
              
              // Check in parent window
              const parentGlobalPlayer = (window as any).__SVGATOR_PLAYER__;
              if (parentGlobalPlayer && parentGlobalPlayer[instance.id]) {
                console.log('✅ Embedded player found in parent window __SVGATOR_PLAYER__["' + instance.id + '"]!');
                instance.player = parentGlobalPlayer[instance.id];
                instance.isReady = true;
                resolve();
                return true;
              }
              
              // Fallback: Check for player attached to SVG element
              const svgPlayer = (svg as any).svgatorPlayer;
              if (svgPlayer) {
                console.log('✅ Embedded player found on SVG element!');
                instance.player = svgPlayer;
                instance.isReady = true;
                resolve();
                return true;
              }
              
              return false;
            };
            
            // Try immediately
            if (checkEmbeddedPlayer()) {
              return;
            }
            
            console.log('🎨 No embedded player yet, waiting for scripts to execute...');
            
            // The scripts inside the SVG need time to execute and attach the player
            // Wait and check again
            setTimeout(() => {
              if (checkEmbeddedPlayer()) {
                return;
              }
              
              // Still no embedded player, try CDN player as fallback
              const objWindow = (obj.contentWindow as any);
              const SVGatorPlayer = objWindow?.SVGatorPlayer || (window as any).SVGatorPlayer;
              
              if (SVGatorPlayer) {
                console.log('✅ CDN SVGatorPlayer available, creating instance...');
                instance.player = new SVGatorPlayer(svg);
                instance.player?.ready(() => {
                  instance.isReady = true;
                  console.log('✅ SVGator player ready for:', instance.id);
                  resolve();
                });
                return;
              }
              
              console.warn('⚠️ No SVGator player found - SVG may not have animations');
              resolve();
            }, 500);
          } catch (error) {
            console.warn(`Error initializing SVGator for object #${instance.id}:`, error);
            resolve();
          }
        };

        if (obj.contentDocument) {
          initPlayer();
        } else {
          obj.addEventListener('load', initPlayer);
        }
      } else {
        // Inline SVG
        try {
          const SVGatorPlayerClass = (window as any).SVGatorPlayer;
          instance.player = new SVGatorPlayerClass(instance.element);
          instance.player?.ready(() => {
            instance.isReady = true;
            resolve();
          });
        } catch (error) {
          console.warn(`Error initializing SVGator for inline SVG #${instance.id}:`, error);
          resolve();
        }
      }
    });
  }

  /**
   * Get a registered instance
   */
  get(id: string): SVGatorInstance | undefined {
    return this.instances.get(id);
  }

  /**
   * Play animation for a specific instance
   */
  play(id: string): void {
    const instance = this.instances.get(id);
    if (instance?.isReady && instance.player) {
      instance.player.play();
    }
  }

  /**
   * Pause animation for a specific instance
   */
  pause(id: string): void {
    const instance = this.instances.get(id);
    if (instance?.isReady && instance.player) {
      instance.player.pause();
    }
  }

  /**
   * Stop and reset animation for a specific instance
   */
  stop(id: string): void {
    const instance = this.instances.get(id);
    if (instance?.isReady && instance.player) {
      instance.player.stop();
    }
  }

  /**
   * Restart animation from beginning
   */
  restart(id: string): void {
    const instance = this.instances.get(id);
    if (instance?.isReady && instance.player) {
      instance.player.restart();
    }
  }

  /**
   * Seek to a specific time in the animation (in seconds)
   */
  seek(id: string, time: number): void {
    const instance = this.instances.get(id);
    if (instance?.isReady && instance.player) {
      instance.player.seek(time * 1000); // SVGator uses milliseconds
    }
  }

  /**
   * Get current animation time (in seconds)
   */
  getCurrentTime(id: string): number {
    const instance = this.instances.get(id);
    if (instance?.isReady && instance.player) {
      return instance.player.getCurrentTime() / 1000; // Convert from ms to seconds
    }
    return 0;
  }

  /**
   * Get total animation duration (in seconds)
   */
  getTotalTime(id: string): number {
    const instance = this.instances.get(id);
    if (instance?.isReady && instance.player) {
      return instance.player.getTotalTime() / 1000; // Convert from ms to seconds
    }
    return 0;
  }

  /**
   * Add event listener to an instance
   * Events: 'play', 'pause', 'stop', 'complete', 'loop'
   */
  on(id: string, event: string, callback: (data?: any) => void): void {
    const instance = this.instances.get(id);
    if (instance?.isReady && instance.player) {
      instance.player.on(event, callback);
    }
  }

  /**
   * Remove event listener from an instance
   */
  off(id: string, event: string, callback: (data?: any) => void): void {
    const instance = this.instances.get(id);
    if (instance?.isReady && instance.player) {
      instance.player.off(event, callback);
    }
  }

  /**
   * Sync SVGator animation with a video element
   * @param svgId - SVGator instance ID
   * @param videoElement - HTML video element or YouTube iframe
   * @param mode - How to sync: 'sync' (timeline sync), 'independent' (separate controls), 'controller' (SVG controls video)
   */
  syncWithVideo(
    svgId: string, 
    videoElement: HTMLVideoElement | HTMLIFrameElement,
    mode: InteractiveMode = 'sync'
  ): () => void {
    const instance = this.instances.get(svgId);
    if (!instance?.isReady) {
      console.warn(`SVGator instance ${svgId} not ready for syncing`);
      return () => {};
    }

    const isYouTube = videoElement.tagName === 'IFRAME';
    const cleanup: (() => void)[] = [];

    if (mode === 'sync') {
      // Timeline sync mode - SVG follows video playback
      if (isYouTube) {
        // For YouTube, we need to use postMessage API
        const handleMessage = (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data);
            if (data.event === 'onStateChange') {
              if (data.info === 1) { // Playing
                this.play(svgId);
              } else if (data.info === 2) { // Paused
                this.pause(svgId);
              }
            }
          } catch (e) {
            // Ignore non-JSON messages
          }
        };
        
        window.addEventListener('message', handleMessage);
        cleanup.push(() => window.removeEventListener('message', handleMessage));
      } else {
        // Native video element
        const video = videoElement as HTMLVideoElement;
        
        const playHandler = () => this.play(svgId);
        const pauseHandler = () => this.pause(svgId);
        const seekHandler = () => this.seek(svgId, video.currentTime);
        
        video.addEventListener('play', playHandler);
        video.addEventListener('pause', pauseHandler);
        video.addEventListener('seeked', seekHandler);
        
        cleanup.push(() => {
          video.removeEventListener('play', playHandler);
          video.removeEventListener('pause', pauseHandler);
          video.removeEventListener('seeked', seekHandler);
        });
      }
    } else if (mode === 'controller') {
      // SVG controls video mode - clicking SVG elements triggers video actions
      // This requires custom implementation per SVG
      console.log(`Controller mode for ${svgId} - implement custom click handlers on SVG elements`);
    }

    // Return cleanup function
    return () => {
      cleanup.forEach(fn => fn());
    };
  }

  /**
   * Unregister and cleanup an instance
   */
  unregister(id: string): void {
    this.instances.delete(id);
  }

  /**
   * Cleanup all instances
   */
  cleanup(): void {
    this.instances.clear();
  }
}

// Global singleton instance
const svgatorController = new SVGatorController();

// Make it available globally
if (typeof window !== 'undefined') {
  (window as any).SVGatorController = svgatorController;
}

export default svgatorController;
