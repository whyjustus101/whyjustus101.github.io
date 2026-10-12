/**
 * A half-submerged lens over a photographic ocean poster and optional film.
 * Real video frames, a gently moving meniscus, and a scroll-driven descent.
 * No dependencies; media is loaded only from the supplied image/video URLs.
 */

const VERTEX_SOURCE = `
  attribute vec2 aPosition;
  varying vec2 vUv;

  void main() {
    vUv = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const FRAGMENT_SOURCE = `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
  #else
    precision mediump float;
  #endif

  uniform sampler2D uOcean;
  uniform sampler2D uVideo;
  uniform vec2 uVideoCover;
  uniform vec2 uVideoHorizon;
  uniform vec3 uVideoTint;
  uniform float uVideoMix;
  uniform float uVideoMode;
  uniform vec2 uCover;
  uniform vec2 uResolution;
  uniform float uAspect;
  uniform vec3 uSourceWaterline;
  uniform vec4 uPhases;
  uniform float uProgress;
  uniform float uMotion;
  varying vec2 vUv;

  vec3 photograph(vec2 point) {
    // Screen and source coordinates are measured down from the top. Textures
    // are uploaded flipped, so only their lookup changes coordinate systems.
    return texture2D(uOcean, clamp(vec2(point.x, 1.0 - point.y), 0.001, 0.999)).rgb;
  }

  void main() {
    vec2 screen = vec2(vUv.x, 1.0 - vUv.y);
    float pixel = 1.0 / max(uResolution.y, 1.0);
    float x = screen.x * min(uAspect, 2.4);
    float descent = smoothstep(0.0, 1.0, uProgress);
    float travel = descent * 0.84;
    float sourceX = (screen.x - 0.5) * uCover.x + 0.5;
    // Three measured points follow the photograph's natural curved meniscus.
    // The fit is evaluated in source coordinates, including portrait crops.
    float sourceLine = 2.0 * (sourceX - 0.5) * (sourceX - 1.0) * uSourceWaterline.x
      + 4.0 * sourceX * (1.0 - sourceX) * uSourceWaterline.y
      + 2.0 * sourceX * (sourceX - 0.5) * uSourceWaterline.z;
    float stillWaterline = 0.48 - travel + (sourceLine - uSourceWaterline.y) / uCover.y;

    // Long swells are deliberately unequal. Their scale is in CSS pixels,
    // giving a close, slow water surface on both a phone and a large display.
    float swellA = sin(x * 4.6 + uPhases.x + 0.5);
    float swellB = sin(x * 9.7 - uPhases.y + 1.8);
    float swellC = sin(x * 20.2 + uPhases.z + swellA * 0.35);
    float swell = (swellA * 0.65 + swellB * 0.25 + swellC * 0.10);
    float amplitude = clamp(25.0 * pixel, 0.016, 0.035);
    // Real split-shot footage supplies its own surface movement.
    float displacement = swell * amplitude * (1.0 - uVideoMix * (1.0 - uVideoMode));
    float waterline = stillWaterline + displacement;
    float distanceToWater = screen.y - waterline;
    float submerged = smoothstep(-2.0 * pixel, 5.0 * pixel, distanceToWater);
    float depth = max(0.0, distanceToWater);

    // Pin the sky and the distant horizon. Only a lens-sized zone around the
    // surface follows the swell; the source photograph supplies its detail.
    float lens = exp(-pow(abs(screen.y - stillWaterline) / 0.115, 2.0));
    vec2 source = vec2(
      sourceX,
      (screen.y + travel - 0.48 - displacement * lens) * uCover.y + uSourceWaterline.y
    );

    float a = sin(x * 8.3 + depth * 13.0 + uPhases.y);
    float b = sin(x * 15.7 - depth * 19.0 - uPhases.z + a * 0.4);
    float c = sin(x * 29.0 + depth * 11.0 + uPhases.x);
    vec2 refraction = vec2(a * 0.65 + b * 0.35, b * 0.65 + c * 0.35);
    float refractionDepth = (0.30 + 0.70 * exp(-depth * 3.5)) * submerged;
    source += refraction * vec2(0.0038, 0.0025) * refractionDepth * uMotion;

    vec3 color = photograph(source);
    // Film is sampled without procedural refraction. Surface-only footage
    // fades into the original lens meniscus, keeping its underwater view.
    vec2 videoPoint = vec2((screen.x - 0.5) * uVideoCover.x + 0.5,
      (screen.y + travel - uVideoHorizon.y) * uVideoCover.y + uVideoHorizon.x);
    vec2 splitPoint = vec2(videoPoint.x,
      (screen.y + travel - 0.48) * uVideoCover.y + uSourceWaterline.y);
    videoPoint = mix(splitPoint, videoPoint, uVideoMode);
    vec3 film = texture2D(uVideo, clamp(vec2(videoPoint.x, 1.0 - videoPoint.y), 0.001, 0.999)).rgb;
    film *= uVideoTint;
    float surfaceBlend = 1.0 - smoothstep(-0.13, -0.025, distanceToWater);
    float filmBlend = mix(1.0, surfaceBlend, uVideoMode) * uVideoMix;
    color = mix(color, film, filmBlend);

    // The photograph already has an irregular, thick lens meniscus. Preserve
    // that water volume instead of adding a synthetic bright line over it.
    float meniscus = exp(-pow(distanceToWater / (22.0 * pixel), 2.0));
    float waveLight = dot(color, vec3(0.2126, 0.7152, 0.0722));

    // Light disappears through a blue-green volume as the camera descends.
    // Source detail remains near the surface; distant depths merge into ink.
    vec3 deepWater = vec3(0.005, 0.029, 0.048);
    float beyondImage = smoothstep(0.79, 1.06, source.y);
    color = mix(color, deepWater, beyondImage * submerged);
    vec3 absorption = exp(-depth * vec3(1.05, 0.44, 0.22));
    color = mix(color, color * absorption, submerged);
    color = mix(color, deepWater, submerged * smoothstep(0.16, 1.25, depth) * 0.52);

    // Soft rays come from a distant patch of sky. Crossing wide and narrow
    // lobes breaks their rhythm before they disappear into deep water.
    float projection = (screen.x - 0.73) * min(uAspect, 1.9) / (depth + 0.22);
    float broadRay = pow(max(0.0, sin(projection * 4.8 + 0.9 + uPhases.w)), 5.0);
    float fineRay = pow(max(0.0, sin(projection * 12.7 - 1.3 - uPhases.w)), 9.0);
    float ray = (broadRay * 0.75 + fineRay * 0.25) * exp(-depth * 2.3);
    float beamFade = smoothstep(0.01, 0.14, depth) * (1.0 - descent * 0.65);
    color += vec3(0.028, 0.080, 0.097) * ray * beamFade * submerged;

    // Fleeting glints only catch highlights that exist in the photograph.
    float glint = smoothstep(0.27, 0.64, waveLight) * meniscus;
    glint *= pow(max(0.0, swellC * 0.5 + b * 0.5), 3.0) * 0.075 * uMotion;
    color += vec3(0.69, 0.88, 0.91) * glint;

    float edge = pow(abs(screen.x - 0.5) * 1.5, 2.0) * 0.13;
    // The source and fallback poster already share a blue-hour color grade.
    color *= 1.0 - edge;
    color = mix(color, deepWater, descent * 0.34);
    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
  }
`;

/**
 * sourceWaterline is the source image's waterline fraction measured from its
 * top: either one value, or [left edge, center, right edge] for a curved line.
 * videoHorizon and videoHorizonScreen align the source and viewport horizons.
 * videoTint multiplies film RGB; use [1, 1, 1] for already graded footage.
 *
 * @param {HTMLCanvasElement} canvas Transparent canvas over a static poster.
 * @param {{imageUrl?: string, videoUrl?: string, videoMode?: 'split' | 'surface',
 *   videoHorizon?: number, videoHorizonScreen?: number, videoTint?: [number, number, number],
 *   sourceWaterline?: number | [number, number, number], onReady?: () => void}} options
 * @returns {{setProgress: (progress: number) => void,
 *   setPaused: (paused: boolean) => void, destroy: () => void}}
 */
export function createOceanScene(canvas, {
  imageUrl = '/assets/waterline-ocean.webp',
  sourceWaterline = [0.517, 0.489, 0.361],
  videoUrl,
  videoMode = 'surface',
  videoHorizon = 0.35,
  videoHorizonScreen = 0.14,
  videoTint = [0.42, 0.56, 0.72],
  onReady,
} = {}) {
  let gl = null;
  let program = null;
  let buffer = null;
  let texture = null;
  let videoTexture = null;
  let video = null;
  let videoFrame = 0;
  let playGeneration = 0;
  let playPending = false;
  let videoFailed = false;
  let videoFrameReady = false;
  let videoFrameDirty = false;
  let videoMix = 0;
  let videoWidth = 1;
  let videoHeight = 1;
  let uploadedVideoWidth = 0;
  let uploadedVideoHeight = 0;
  let uploadedVideoTime = -1;
  let vertexShader = null;
  let fragmentShader = null;
  let resizeObserver = null;
  let intersectionObserver = null;
  let mediaQuery = null;
  let image = null;
  let uniforms = null;
  let animationFrame = 0;
  let destroyed = false;
  let loaded = false;
  let announced = false;
  let paused = false;
  let inView = true;
  let reducedMotion = false;
  let previousTime = 0;
  let elapsed = 0;
  let progress = 0;
  let targetProgress = 0;
  let width = 0;
  let height = 0;
  let imageWidth = 1;
  let imageHeight = 1;
  const listeners = [];

  function listen(target, event, listener, options) {
    target.addEventListener(event, listener, options);
    listeners.push(() => target.removeEventListener(event, listener, options));
  }

  function stop() {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    previousTime = 0;
    playGeneration += 1;
    playPending = false;
    if (videoFrame && video?.cancelVideoFrameCallback) video.cancelVideoFrameCallback(videoFrame);
    videoFrame = 0;
    video?.pause();
  }

  function releaseVideo() {
    if (!video) return;
    video.pause();
    video.removeAttribute('src');
    video.load();
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    stop();
    resizeObserver?.disconnect();
    intersectionObserver?.disconnect();
    listeners.forEach((remove) => remove());
    releaseVideo();
    if (image) {
      image.onload = null;
      image.onerror = null;
      image.removeAttribute('src');
    }
    if (gl && !gl.isContextLost()) {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      if (texture) gl.deleteTexture(texture);
      if (videoTexture) gl.deleteTexture(videoTexture);
      if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program);
      if (vertexShader) gl.deleteShader(vertexShader);
      if (fragmentShader) gl.deleteShader(fragmentShader);
    }
  }

  function fallback() {
    if (destroyed) return;
    // A lost context or failed texture must never cover the working poster.
    if (canvas?.style) canvas.style.opacity = '0';
    destroy();
  }

  function isActive() {
    return !destroyed && !paused && !reducedMotion && !document.hidden && inView && width > 0 && height > 0;
  }

  function canAnimate() {
    return loaded && isActive();
  }

  function watchVideoFrames() {
    if (!video || videoFrame || !isActive() || !video.requestVideoFrameCallback) return;
    videoFrame = video.requestVideoFrameCallback(() => {
      videoFrame = 0;
      if (!isActive() || videoFailed) return;
      videoFrameDirty = true;
      schedule();
      watchVideoFrames();
    });
  }

  function videoFallback() {
    if (destroyed || videoFailed) return;
    videoFailed = true;
    stop();
    releaseVideo();
    videoFrameReady = false;
    videoFrameDirty = false;
    videoMix = 0;
    resize();
  }

  function refreshVideo() {
    if (!videoUrl || videoFailed || !isActive() || !loaded) return;
    if (!video) {
      video = document.createElement('video');
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.loop = true;
      video.preload = 'auto';
      if (new URL(videoUrl, document.baseURI).origin !== window.location.origin) video.crossOrigin = 'anonymous';
      listen(video, 'error', videoFallback);
      listen(video, 'loadeddata', () => {
        if (destroyed || videoFailed || !isActive()) return;
        videoFrameDirty = true;
        schedule();
      });
      video.src = videoUrl;
    }
    watchVideoFrames();
    if (playPending || !video.paused) return;
    const generation = ++playGeneration;
    playPending = true;
    let playing;
    try { playing = video.play(); } catch { videoFallback(); return; }
    if (!playing?.then) { playPending = false; return; }
    playing.then(() => {
      if (destroyed || generation !== playGeneration) return;
      playPending = false;
      if (!isActive()) video.pause();
    }).catch(error => {
      if (destroyed || generation !== playGeneration) return;
      playPending = false;
      // Pausing while play() is pending normally rejects with AbortError.
      if (error.name === 'AbortError') return;
      if (error.name === 'NotAllowedError') {
        if (videoFrame && video.cancelVideoFrameCallback) video.cancelVideoFrameCallback(videoFrame);
        videoFrame = 0;
        return; // A subsequent user-initiated setPaused(false) retries play().
      }
      videoFallback();
    });
  }

  function uploadVideoFrame() {
    if (!video || videoFailed || video.readyState < 2) return;
    if (!video.requestVideoFrameCallback && video.currentTime !== uploadedVideoTime) videoFrameDirty = true;
    if (!videoFrameDirty) return;
    videoFrameDirty = false;
    const nextWidth = video.videoWidth;
    const nextHeight = video.videoHeight;
    if (!nextWidth || !nextHeight) return;
    if (Math.max(nextWidth, nextHeight) > gl.getParameter(gl.MAX_TEXTURE_SIZE)) {
      videoFallback();
      return;
    }
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, videoTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    if (uploadedVideoWidth !== nextWidth || uploadedVideoHeight !== nextHeight) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
      if (gl.getError() !== gl.NO_ERROR) {
        gl.activeTexture(gl.TEXTURE0);
        videoFallback();
        return;
      }
      uploadedVideoWidth = nextWidth;
      uploadedVideoHeight = nextHeight;
    } else {
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, video);
    }
    gl.activeTexture(gl.TEXTURE0);
    uploadedVideoTime = video.currentTime;
    videoWidth = nextWidth;
    videoHeight = nextHeight;
    const firstFrame = !videoFrameReady;
    videoFrameReady = true;
    if (firstFrame) resize(false);
  }

  function schedule() {
    if (!animationFrame && canAnimate() && width && height) {
      animationFrame = requestAnimationFrame(tick);
    }
  }

  function draw() {
    if (!loaded || destroyed || !width || !height) return;
    try {
      if (gl.isContextLost()) {
        fallback();
        return;
      }
      uploadVideoFrame();
      if (destroyed) return;
      gl.uniform1f(uniforms.videoMix, reducedMotion ? 0 : videoMix);
      // Bounded phases avoid low-precision mobile shaders stuttering after a
      // long session. Every wrap is a complete, visually continuous sine turn.
      const turn = Math.PI * 2;
      gl.uniform4f(
        uniforms.phases,
        (elapsed * 0.39) % turn,
        (elapsed * 0.27) % turn,
        (elapsed * 0.51) % turn,
        (elapsed * 0.031) % turn,
      );
      gl.uniform1f(uniforms.progress, reducedMotion ? 0 : progress);
      gl.uniform1f(uniforms.motion, reducedMotion ? 0 : 1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!announced) {
        if (gl.getError() !== gl.NO_ERROR) {
          fallback();
          return;
        }
        announced = true;
        if (typeof onReady === 'function') onReady();
      }
    } catch {
      fallback();
    }
  }

  function tick(timestamp) {
    animationFrame = 0;
    if (!canAnimate()) {
      previousTime = 0;
      return;
    }
    const delta = previousTime ? Math.min((timestamp - previousTime) / 1000, 0.05) : 0;
    previousTime = timestamp;
    elapsed += delta;
    if (videoFrameReady) videoMix = Math.min(1, videoMix + delta / 0.8);
    progress += (targetProgress - progress) * (1 - Math.exp(-delta * 4.1));
    draw();
    // At rest, actual video frames drive rendering. RAF only fills in scroll
    // easing/fades, or polls currentTime on browsers without the video API.
    if (!videoFrameReady || !video?.requestVideoFrameCallback || videoMix < 1
      || Math.abs(targetProgress - progress) > 0.0005) schedule();
  }

  function resize(render = true) {
    if (destroyed || !gl) return;
    const bounds = canvas.getBoundingClientRect();
    width = Math.max(0, bounds.width);
    height = Math.max(0, bounds.height);
    if (!width || !height) {
      stop();
      return;
    }

    // A real UHD source can fill a 3840x2160 framebuffer, including a 1080p
    // CSS viewport at DPR 2. Smaller media never buys an oversized buffer.
    const nativeVideoPixels = videoFrameReady ? videoWidth * videoHeight : 3_000_000;
    const pixelBudget = Math.min(8_294_400, nativeVideoPixels);
    const maxDimension = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
    const ratio = Math.min(
      window.devicePixelRatio || 1,
      videoFrameReady ? 2 : 1.5,
      Math.sqrt(pixelBudget / (width * height)),
      maxDimension / width,
      maxDimension / height,
    );
    const nextWidth = Math.max(1, Math.round(width * ratio));
    const nextHeight = Math.max(1, Math.round(height * ratio));
    if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
      canvas.width = nextWidth;
      canvas.height = nextHeight;
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
    const aspect = width / height;
    const imageAspect = imageWidth / imageHeight;
    gl.uniform1f(uniforms.aspect, aspect);
    gl.uniform2f(uniforms.resolution, width, height);
    gl.uniform2f(uniforms.cover, Math.min(1, aspect / imageAspect), Math.min(1, imageAspect / aspect));
    const videoAspect = videoWidth / videoHeight;
    gl.uniform2f(uniforms.videoCover, Math.min(1, aspect / videoAspect), Math.min(1, videoAspect / aspect));
    if (render) draw();
    refreshVideo();
    schedule();
  }

  function refreshActivity() {
    stop();
    if (!document.hidden && inView) {
      refreshVideo();
      draw();
      schedule();
    }
  }

  const api = {
    setProgress(value) {
      if (destroyed || !Number.isFinite(value)) return;
      const nextProgress = Math.max(0, Math.min(1, value));
      if (nextProgress === targetProgress) return;
      targetProgress = nextProgress;
      // The reduced-motion frame does not use scroll progress. Keep its state
      // current for a later preference change without submitting another frame.
      if (reducedMotion) {
        progress = targetProgress;
        return;
      }
      if (!canAnimate()) {
        progress = targetProgress;
        if (!document.hidden && inView) draw();
      } else {
        schedule();
      }
    },
    setPaused(value) {
      if (destroyed) return;
      paused = Boolean(value);
      refreshActivity();
    },
    destroy,
  };

  if (!canvas || typeof canvas.getContext !== 'function') {
    fallback();
    return api;
  }

  try {
    gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: 'low-power',
    });
    if (!gl) {
      fallback();
      return api;
    }

    function compile(type, source) {
      const shader = gl.createShader(type);
      if (!shader) throw new Error('Shader allocation failed');
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        throw new Error('Ocean shader is unsupported');
      }
      return shader;
    }

    vertexShader = compile(gl.VERTEX_SHADER, VERTEX_SOURCE);
    fragmentShader = compile(gl.FRAGMENT_SHADER, FRAGMENT_SOURCE);
    program = gl.createProgram();
    if (!program) throw new Error('Program allocation failed');
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Ocean program is unsupported');
    gl.useProgram(program);

    // A single oversize triangle avoids a seam across the moving photograph.
    buffer = gl.createBuffer();
    if (!buffer) throw new Error('Buffer allocation failed');
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    uniforms = {
      cover: gl.getUniformLocation(program, 'uCover'),
      resolution: gl.getUniformLocation(program, 'uResolution'),
      sourceWaterline: gl.getUniformLocation(program, 'uSourceWaterline'),
      videoCover: gl.getUniformLocation(program, 'uVideoCover'),
      videoMix: gl.getUniformLocation(program, 'uVideoMix'),
      aspect: gl.getUniformLocation(program, 'uAspect'),
      phases: gl.getUniformLocation(program, 'uPhases'),
      progress: gl.getUniformLocation(program, 'uProgress'),
      motion: gl.getUniformLocation(program, 'uMotion'),
    };

    texture = gl.createTexture();
    if (!texture) throw new Error('Texture allocation failed');
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(gl.getUniformLocation(program, 'uOcean'), 0);
    const profile = Array.isArray(sourceWaterline) && sourceWaterline.length === 3
      ? sourceWaterline : [sourceWaterline, sourceWaterline, sourceWaterline];
    gl.uniform3f(uniforms.sourceWaterline, ...profile.map(point => Number.isFinite(point)
      ? Math.max(0.05, Math.min(0.95, point)) : 0.48));
    videoTexture = gl.createTexture();
    if (!videoTexture) throw new Error('Video texture allocation failed');
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, videoTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
    gl.uniform1i(gl.getUniformLocation(program, 'uVideo'), 1);
    gl.uniform1f(gl.getUniformLocation(program, 'uVideoMode'), videoMode === 'split' ? 0 : 1);
    gl.uniform2f(gl.getUniformLocation(program, 'uVideoHorizon'),
      Number.isFinite(videoHorizon) ? videoHorizon : 0.35,
      Number.isFinite(videoHorizonScreen) ? videoHorizonScreen : 0.14);
    const tint = Array.isArray(videoTint) && videoTint.length === 3 ? videoTint : [1, 1, 1];
    gl.uniform3f(gl.getUniformLocation(program, 'uVideoTint'), ...tint.map(channel =>
      Number.isFinite(channel) ? Math.max(0, Math.min(2, channel)) : 1));
    gl.activeTexture(gl.TEXTURE0);
    gl.clearColor(0, 0, 0, 0);

    mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotion = mediaQuery.matches;
    const updateMotionPreference = () => {
      reducedMotion = mediaQuery.matches;
      refreshActivity();
    };
    if (typeof mediaQuery.addEventListener === 'function') {
      listen(mediaQuery, 'change', updateMotionPreference);
    } else if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(updateMotionPreference);
      listeners.push(() => mediaQuery.removeListener(updateMotionPreference));
    }
    listen(document, 'visibilitychange', refreshActivity);
    listen(canvas, 'webglcontextlost', fallback);
    listen(window, 'resize', resize, { passive: true });

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(canvas);
    }
    if (typeof IntersectionObserver !== 'undefined') {
      intersectionObserver = new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting;
        refreshActivity();
      });
      intersectionObserver.observe(canvas);
    }

    image = new Image();
    image.decoding = 'async';
    if (new URL(imageUrl, document.baseURI).origin !== window.location.origin) image.crossOrigin = 'anonymous';
    image.onload = () => {
      if (destroyed) return;
      try {
        imageWidth = image.naturalWidth;
        imageHeight = image.naturalHeight;
        if (!imageWidth || !imageHeight) throw new Error('Ocean image is empty');

        const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
        const downscale = Math.min(1, maxTextureSize / Math.max(imageWidth, imageHeight));
        let source = image;
        if (downscale < 1) {
          const resized = document.createElement('canvas');
          resized.width = Math.max(1, Math.floor(imageWidth * downscale));
          resized.height = Math.max(1, Math.floor(imageHeight * downscale));
          const context = resized.getContext('2d');
          if (!context) throw new Error('Texture resizing is unsupported');
          context.drawImage(image, 0, 0, resized.width, resized.height);
          source = resized;
        }
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
        loaded = true;
        resize();
      } catch {
        fallback();
      }
    };
    image.onerror = fallback;
    image.src = imageUrl;
  } catch {
    fallback();
  }

  return api;
}
