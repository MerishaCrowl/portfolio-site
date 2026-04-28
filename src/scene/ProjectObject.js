import * as THREE from 'three';

/**
 * ProjectObject - Hidden objects in the scene that reveal on proximity
 * Each represents a portfolio project with a glowing halo effect
 */
export class ProjectObject {
    constructor(scene, projectData) {
        this.scene = scene;
        this.data = projectData;
        this.group = new THREE.Group();
        this.isRevealed = false;
        this.isHovered = false;
        this.revealProgress = 0;
        this.time = 0;
        
        this.config = {
            haloRadius: 3,
            revealDistance: 8,
            hoverScale: 1.15,
        };
        
        this.init();
    }
    
    init() {
        // Create the main object based on type
        this.createObject();
        
        // Create the halo/glow effect
        this.createHalo();
        
        // Position from project data
        const pos = this.data.sceneObject.position;
        this.group.position.set(pos.x, pos.y, pos.z);
        
        // Start hidden
        this.group.visible = false;
        this.setRevealProgress(0);
        
        this.scene.add(this.group);
    }
    
    createObject() {
        // Create different 3D objects based on project type
        const objectType = this.data.sceneObject.type;
        let geometry;
        
        switch (objectType) {
            case 'pizza':
                // Stylized pizza/food shape
                geometry = new THREE.TorusGeometry(1.2, 0.4, 8, 32);
                break;
            case 'monitor':
                // Computer monitor shape
                geometry = new THREE.BoxGeometry(2, 1.5, 0.1);
                break;
            case 'cookie':
                // Cookie shape
                geometry = new THREE.CylinderGeometry(1, 1, 0.3, 16);
                break;
            default:
                geometry = new THREE.IcosahedronGeometry(1, 1);
        }
        
        // Material with edge glow effect
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                revealProgress: { value: 0 },
                haloColor: { value: new THREE.Color(this.data.sceneObject.haloColor) },
                isHovered: { value: 0 },
            },
            vertexShader: `
                varying vec3 vNormal;
                varying vec3 vPosition;
                varying vec2 vUv;
                
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vPosition = position;
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform float revealProgress;
                uniform vec3 haloColor;
                uniform float isHovered;
                
                varying vec3 vNormal;
                varying vec3 vPosition;
                varying vec2 vUv;
                
                void main() {
                    // Edge detection
                    vec3 viewDir = normalize(cameraPosition - vPosition);
                    float edge = 1.0 - abs(dot(viewDir, vNormal));
                    edge = pow(edge, 2.0);
                    
                    // Pulsing effect when hovered
                    float pulse = 1.0 + sin(time * 3.0) * 0.1 * isHovered;
                    
                    // Color with reveal animation
                    vec3 color = haloColor * (0.5 + edge * 1.5) * pulse;
                    
                    // Alpha based on reveal progress and edge
                    float alpha = edge * revealProgress;
                    alpha += 0.1 * revealProgress; // Slight inner visibility
                    
                    // Add scan line effect during reveal
                    if (revealProgress < 1.0) {
                        float scanLine = sin((vPosition.y + time * 2.0) * 10.0) * 0.5 + 0.5;
                        alpha *= 0.5 + scanLine * 0.5;
                    }
                    
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        });
        
        this.object = new THREE.Mesh(geometry, material);
        this.group.add(this.object);
    }
    
    createHalo() {
        // Outer glow ring
        const haloGeometry = new THREE.RingGeometry(
            this.config.haloRadius * 0.8,
            this.config.haloRadius,
            64
        );
        
        const haloMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                revealProgress: { value: 0 },
                haloColor: { value: new THREE.Color(this.data.sceneObject.haloColor) },
            },
            vertexShader: `
                varying vec2 vUv;
                
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform float revealProgress;
                uniform vec3 haloColor;
                
                varying vec2 vUv;
                
                void main() {
                    // Rotating glow effect
                    float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
                    float dist = length(vUv - 0.5) * 2.0;
                    
                    // Create sweeping light effect
                    float sweep = sin(angle * 3.0 + time * 2.0) * 0.5 + 0.5;
                    sweep = pow(sweep, 3.0);
                    
                    // Fade at edges
                    float fade = 1.0 - abs(dist - 0.9) * 10.0;
                    fade = clamp(fade, 0.0, 1.0);
                    
                    vec3 color = haloColor;
                    float alpha = sweep * fade * revealProgress * 0.6;
                    
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        });
        
        this.halo = new THREE.Mesh(haloGeometry, haloMaterial);
        this.halo.rotation.x = -Math.PI / 2;
        this.halo.position.y = -0.5;
        this.group.add(this.halo);
        
        // Particle ring
        this.createParticleRing();
    }
    
    createParticleRing() {
        const particleCount = 50;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const angles = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const radius = this.config.haloRadius * 0.9;
            
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = Math.sin(angle) * radius;
            
            angles[i] = angle;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('angle', new THREE.BufferAttribute(angles, 1));
        
        const material = new THREE.PointsMaterial({
            color: this.data.sceneObject.haloColor,
            size: 0.15,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        
        this.particles = new THREE.Points(geometry, material);
        this.group.add(this.particles);
    }
    
    /**
     * Check distance to character and update reveal state
     */
    checkProximity(characterPosition) {
        const distance = this.group.position.distanceTo(characterPosition);
        
        if (distance < this.config.revealDistance) {
            const progress = 1 - (distance / this.config.revealDistance);
            this.setRevealProgress(Math.max(this.revealProgress, progress));
            
            if (!this.isRevealed && this.revealProgress > 0.5) {
                this.isRevealed = true;
                this.onReveal();
            }
        }
    }
    
    setRevealProgress(progress) {
        this.revealProgress = progress;
        this.group.visible = progress > 0;
        
        // Update shader uniforms
        this.object.material.uniforms.revealProgress.value = progress;
        this.halo.material.uniforms.revealProgress.value = progress;
        this.particles.material.opacity = progress * 0.8;
    }
    
    onReveal() {
        // Dispatch custom event for UI to respond
        window.dispatchEvent(new CustomEvent('projectRevealed', {
            detail: { project: this.data }
        }));
    }
    
    setHovered(isHovered) {
        this.isHovered = isHovered;
        this.object.material.uniforms.isHovered.value = isHovered ? 1 : 0;
    }
    
    update(deltaTime) {
        this.time += deltaTime;
        
        // Update shader time uniforms
        this.object.material.uniforms.time.value = this.time;
        this.halo.material.uniforms.time.value = this.time;
        
        // Rotate object slowly
        this.object.rotation.y += 0.005;
        
        // Hover scale animation
        const targetScale = this.isHovered ? this.config.hoverScale : 1;
        const currentScale = this.object.scale.x;
        const newScale = THREE.MathUtils.lerp(currentScale, targetScale, 0.1);
        this.object.scale.setScalar(newScale);
        
        // Animate particles
        const positions = this.particles.geometry.attributes.position.array;
        const angles = this.particles.geometry.attributes.angle.array;
        
        for (let i = 0; i < angles.length; i++) {
            const angle = angles[i] + this.time * 0.5;
            const radius = this.config.haloRadius * 0.9;
            const yOffset = Math.sin(angle * 3 + this.time * 2) * 0.2;
            
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = yOffset;
            positions[i * 3 + 2] = Math.sin(angle) * radius;
        }
        
        this.particles.geometry.attributes.position.needsUpdate = true;
    }
    
    /**
     * Get bounding box for raycasting
     */
    getBoundingBox() {
        return new THREE.Box3().setFromObject(this.object);
    }
    
    getClickableMesh() {
        return this.object;
    }
    
    dispose() {
        this.object.geometry.dispose();
        this.object.material.dispose();
        this.halo.geometry.dispose();
        this.halo.material.dispose();
        this.particles.geometry.dispose();
        this.particles.material.dispose();
        this.scene.remove(this.group);
    }
}
