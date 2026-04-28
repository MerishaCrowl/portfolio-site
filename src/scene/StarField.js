import * as THREE from 'three';

/**
 * StarField - Creates a realistic twinkling star background
 * Stars are distributed in a sphere around the scene with varying sizes and brightness
 */
export class StarField {
    constructor(scene) {
        this.scene = scene;
        this.stars = null;
        this.starData = [];
        this.time = 0;
        
        this.config = {
            starCount: 3000,
            fieldRadius: 500,
            minSize: 0.5,
            maxSize: 2.5,
            twinkleSpeed: 0.002,
            colorVariation: 0.1, // Slight color temperature variation
        };
        
        this.init();
    }
    
    init() {
        const { starCount, fieldRadius, minSize, maxSize } = this.config;
        
        // Create geometry
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);
        const colors = new Float32Array(starCount * 3);
        const twinkleOffsets = new Float32Array(starCount);
        const twinkleSpeeds = new Float32Array(starCount);
        
        for (let i = 0; i < starCount; i++) {
            // Distribute stars in a sphere, with more concentration toward the "back"
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const radius = fieldRadius * (0.3 + Math.random() * 0.7);
            
            // Push stars more toward the back of the scene (negative Z)
            const zBias = Math.random() < 0.7 ? -1 : 1;
            
            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.6; // Flatten vertically
            positions[i * 3 + 2] = radius * Math.cos(phi) * zBias - 100; // Push back
            
            // Vary sizes - most stars small, few larger
            const sizeFactor = Math.pow(Math.random(), 2.5); // Exponential distribution
            sizes[i] = minSize + sizeFactor * (maxSize - minSize);
            
            // Star colors - mostly white with slight blue/yellow tints
            const colorTemp = 0.9 + Math.random() * 0.2; // 0.9 to 1.1
            const variation = (Math.random() - 0.5) * this.config.colorVariation;
            colors[i * 3] = Math.min(1, colorTemp + variation);
            colors[i * 3 + 1] = Math.min(1, colorTemp);
            colors[i * 3 + 2] = Math.min(1, colorTemp - variation * 0.5);
            
            // Twinkle parameters
            twinkleOffsets[i] = Math.random() * Math.PI * 2;
            twinkleSpeeds[i] = 0.5 + Math.random() * 1.5;
            
            this.starData.push({
                baseSize: sizes[i],
                twinkleOffset: twinkleOffsets[i],
                twinkleSpeed: twinkleSpeeds[i],
            });
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        // Custom shader material for realistic star rendering
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                pixelRatio: { value: window.devicePixelRatio },
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                
                varying vec3 vColor;
                varying float vSize;
                
                uniform float time;
                uniform float pixelRatio;
                
                void main() {
                    vColor = color;
                    vSize = size;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    
                    // Size attenuation based on distance
                    float sizeAttenuation = 300.0 / -mvPosition.z;
                    gl_PointSize = size * sizeAttenuation * pixelRatio;
                    
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                varying float vSize;
                
                void main() {
                    // Create circular point with soft edges
                    vec2 center = gl_PointCoord - vec2(0.5);
                    float dist = length(center);
                    
                    // Soft circular falloff
                    float alpha = 1.0 - smoothstep(0.2, 0.5, dist);
                    
                    // Add glow effect for larger stars
                    float glow = exp(-dist * 3.0) * 0.5;
                    
                    vec3 finalColor = vColor + glow;
                    
                    gl_FragColor = vec4(finalColor, alpha);
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        });
        
        this.stars = new THREE.Points(geometry, material);
        this.scene.add(this.stars);
    }
    
    update(deltaTime) {
        this.time += deltaTime;
        
        // Update shader time uniform
        this.stars.material.uniforms.time.value = this.time;
        
        // Update individual star sizes for twinkling
        const sizes = this.stars.geometry.attributes.size.array;
        
        for (let i = 0; i < this.starData.length; i++) {
            const star = this.starData[i];
            const twinkle = Math.sin(this.time * star.twinkleSpeed + star.twinkleOffset);
            const twinkleFactor = 0.7 + twinkle * 0.3; // Vary between 0.7 and 1.0
            sizes[i] = star.baseSize * twinkleFactor;
        }
        
        this.stars.geometry.attributes.size.needsUpdate = true;
        
        // Subtle rotation of the entire starfield
        this.stars.rotation.y += 0.00005;
        this.stars.rotation.x += 0.00002;
    }
    
    /**
     * Called when "lights turn on" - stars fade to reveal environment
     */
    revealEnvironment(duration = 3) {
        return new Promise((resolve) => {
            const startOpacity = 1;
            const endOpacity = 0.15; // Stars dim but don't fully disappear
            
            const animate = (progress) => {
                const opacity = startOpacity + (endOpacity - startOpacity) * progress;
                this.stars.material.opacity = opacity;
            };
            
            // Use GSAP if available, otherwise simple animation
            if (window.gsap) {
                gsap.to({}, {
                    duration,
                    onUpdate: function() {
                        animate(this.progress());
                    },
                    onComplete: resolve,
                    ease: 'power2.inOut'
                });
            } else {
                let start = null;
                const step = (timestamp) => {
                    if (!start) start = timestamp;
                    const progress = Math.min((timestamp - start) / (duration * 1000), 1);
                    animate(progress);
                    if (progress < 1) {
                        requestAnimationFrame(step);
                    } else {
                        resolve();
                    }
                };
                requestAnimationFrame(step);
            }
        });
    }
    
    onResize() {
        this.stars.material.uniforms.pixelRatio.value = window.devicePixelRatio;
    }
    
    dispose() {
        this.stars.geometry.dispose();
        this.stars.material.dispose();
        this.scene.remove(this.stars);
    }
}
