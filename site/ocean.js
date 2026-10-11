/**
 * A small progressive enhancement over the ocean photograph beneath the canvas.
 * The photograph supplies the detail; the shader only moves the water gently.
 * No libraries, remote requests (apart from imageUrl), or generated noise textures.
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
  precision mediump float;

  uniform sampler2D uOcean;
  uniform vec2 uCover;
  uniform float uAspect;
  uniform vec4 uPhases;
  uniform float uProgress;
  uniform float uMotion;
  varying vec2 vUv;

  void main() {
    // A little overscan leaves room for the swell without exposing image edges.
    float zoom = 1.018 + uProgress * 0.072;
    vec2 frame = (vUv - 0.5) / zoom + 0.5;
    frame.y -= uProgress * 0.022;

    // Broad, crossing swells drift along the same water surface. Their periods
    // intentionally differ, so there is no obvious short animation loop.
    vec2 p = vec2(vUv.x * min(uAspect, 2.4), vUv.y);
    float a = sin(dot(p, vec2(7.5, -17.0)) + uPhases.x);
    float b = sin(dot(p, vec2(-11.0, -23.0)) + uPhases.y + a * 0.26);
    float c = sin(dot(p, vec2(19.0, -35.0)) + uPhases.z + b * 0.18);

    // Perspective keeps the distant water calm. Tiny movement in both axes
    // animates the existing crests instead of painting bright artificial waves.
    float foreground = 0.09 + 0.91 * pow(1.0 - vUv.y, 1.75);
    vec2 current = vec2(a * 0.71 + b * 0.29, b * 0.65 + c * 0.35);
    frame += current * vec2(0.0033, 0.0023) * foreground * uMotion;
    frame.x += sin(uPhases.w) * 0.0011 * uMotion;

    vec2 uv = (frame - 0.5) * uCover + 0.5;
    vec3 sea = texture2D(uOcean, clamp(uv, 0.001, 0.999)).rgb;

    // Only the photograph's own highlights catch the changing light.
    float luminance = dot(sea, vec3(0.2126, 0.7152, 0.0722));
    float reflection = smoothstep(0.30, 0.85, luminance);
    float light = (a * 0.55 + c * 0.45) * 0.022 * foreground * uMotion;
    sea += vec3(0.76, 0.91, 1.0) * reflection * light;

    gl_FragColor = vec4(clamp(sea, 0.0, 1.0), 1.0);
  }
`;

/**
 * @param {HTMLCanvasElement} canvas Transparent canvas over a static poster.
 * @param {{imageUrl?: string, onReady?: () => void}} options
 * @returns {{setProgress: (progress: number) => void,
 *   setPaused: (paused: boolean) => void, destroy: () => void}}
 */
export function createOceanScene(canvas, { imageUrl = '/assets/ocean-surface.webp', onReady } = {}) {
  let gl = null;
  let program = null;
  let buffer = null;
  let texture = null;
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
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    stop();
    resizeObserver?.disconnect();
    intersectionObserver?.disconnect();
    listeners.forEach((remove) => remove());
    if (image) {
      image.onload = null;
      image.onerror = null;
      image.removeAttribute('src');
    }
    if (gl && !gl.isContextLost()) {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      if (texture) gl.deleteTexture(texture);
      if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program);
      if (vertexShader) gl.deleteShader(vertexShader);
      if (fragmentShader) gl.deleteShader(fragmentShader);
    }
  }

  function fallback() {
    // A lost context or failed texture must never cover the working poster.
    if (canvas?.style) canvas.style.opacity = '0';
    destroy();
  }

  function canAnimate() {
    return loaded && !destroyed && !paused && !reducedMotion && !document.hidden && inView;
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
      // Bounded phases avoid low-precision mobile shaders stuttering after a
      // long session. Every wrap is a complete, visually continuous sine turn.
      const turn = Math.PI * 2;
      gl.uniform4f(
        uniforms.phases,
        (elapsed * 0.47) % turn,
        (elapsed * 0.31) % turn,
        (elapsed * 0.63) % turn,
        (elapsed * 0.055) % turn,
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
    progress += (targetProgress - progress) * (1 - Math.exp(-delta * 5));
    draw();
    schedule();
  }

  function resize() {
    if (destroyed || !gl) return;
    const bounds = canvas.getBoundingClientRect();
    width = Math.max(0, bounds.width);
    height = Math.max(0, bounds.height);
    if (!width || !height) {
      stop();
      return;
    }

    // Keep high-density laptops and large external displays within a modest
    // pixel budget. One texture sample per pixel keeps the pass inexpensive.
    const maxDimension = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
    const ratio = Math.min(
      window.devicePixelRatio || 1,
      1.5,
      Math.sqrt(3_000_000 / (width * height)),
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
    gl.uniform2f(uniforms.cover, Math.min(1, aspect / imageAspect), Math.min(1, imageAspect / aspect));
    draw();
    schedule();
  }

  function refreshActivity() {
    stop();
    if (!document.hidden && inView) {
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
