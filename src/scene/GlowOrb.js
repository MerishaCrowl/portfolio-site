import * as THREE from 'three';

/**
 * GlowOrb - The glowing cursor that the character follows
 * Creates a luminous orb effect with inner glow and particle trails
 */
export class GlowOrb {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.targetPosition = new THREE.Vector3(0, 0, 0);
        this.currentPosition = new THREE.Vector3(0, 0, 0);
        this.time = 0;
        
        this.config = {
            orbRadius: 0.3,
            glowRadius: 1.5,
            followSpeed: 0.08,
            bobAmount: 0.1,
            bobSpeed: 2,
            particleCount: 50,
            trailLength: 20,
        };
        
        this.trail = [];
        this.particles = [];
        
        this.init();
    }
    
    init() {
        // Core orb
        const coreGeometry = new THREE.SphereGeometry(this.config.orbRadius, 32, 32);
        const coreMaterial = new THREE.MeshBasicMaterial({
            color: 0x00f5d4,
            transparent: true,
            opacity: 0.9,
        });
        this.core = new THREE.Mesh(coreGeometry, coreMaterial);
        this.group.add(this.core);
        
        // Inner glow layer
        const innerGlowGeometry = new THREE.SphereGeometry(this.config.orbRadius * 1.3, 32, 32);
        const innerGlowMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color1: { value: new THREE.Color(0x00f5d4) },
                color2: { value: new THREE.Color(0x9b5de5) },
            },
            vertexShader: `
                varying vec3 vNormal;
                varying vec3 vPosition;
                
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 color1;
                uniform vec3 color2;
                
                varying vec3 vNormal;
                varying vec3 vPosition;
                
                void main() {
                    // Fresnel effect for edge glow
                    vec3 viewDir = normalize(cameraPosition - vPosition);
                    float fresnel = 1.0 - max(dot(viewDir, vNormal), 0.0);
                    fresnel = pow(fresnel, 2.0);
                    
                    // Animated color blend
                    float blend = sin(time * 2.0) * 0.5 + 0.5;
                    vec3 glowColor = mix(color1, color2, blend);
                    
                    float alpha = fresnel * 0.6;
                    gl_FragColor = vec4(glowColor, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
            depthWrite: false,
        });
        this.innerGlow = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial);
        this.group.add(this.innerGlow);
        
        // Outer glow (sprite)
        const outerGlowTexture = this.createGlowTexture();
        const outerGlowMaterial = new THREE.SpriteMaterial({
            map: outerGlowTexture,
            color: 0x00f5d4,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        this.outerGlow = new THREE.Sprite(outerGlowMaterial);
        this.outerGlow.scale.set(this.config.glowRadius * 2, this.config.glowRadius * 2, 1);
        this.group.add(this.outerGlow);
        
        // Create particle system for sparkles
        this.initParticles();
        
        // Add to scene
        this.scene.add(this.group);
        
        // Initially hide
        this.group.visible = false;
    }
    
    createGlowTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        // Create radial gradient
        const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.2, 'rgba(0, 245, 212, 0.8)');
        gradient.addColorStop(0.5, 'rgba(155, 93, 229, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 128, 128);
        
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }
    
    initParticles() {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.config.particleCount * 3);
        const velocities = [];
        
        for (let i = 0; i < this.config.particleCount; i++) {
            positions[i * 3] = 0;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = 0;
            
            velocities.push({
                x: (Math.random() - 0.5) * 0.02,
                y: (Math.random() - 0.5) * 0.02,
                z: (Math.random() - 0.5) * 0.02,
                life: Math.random(),
                maxLife: 0.5 + Math.random() * 0.5,
            });
        }
        
        this.particleVelocities = velocities;
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0x00f5d4,
            size: 0.1,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        
        this.particleSystem = new THREE.Points(geometry, material);
        this.group.add(this.particleSystem);
    }
    
    show() {
        this.group.visible = true;
    }
    
    hide() {
        this.group.visible = false;
    }
    
    /**
     * Convert mouse screen position to world position
     */
    setTargetFromMouse(mouseX, mouseY, camera) {
        // Create a plane at z = 0 for intersection
        const planeZ = 0;
        const vector = new THREE.Vector3(mouseX, mouseY, 0.5);
        vector.unproject(camera);
        
        const direction = vector.sub(camera.position).normalize();
        const distance = (planeZ - camera.position.z) / direction.z;
        
        const targetPos = camera.position.clone().add(direction.multiplyScalar(distance));
        
        // Clamp to reasonable bounds
        targetPos.x = Math.max(-30, Math.min(30, targetPos.x));
        targetPos.y = Math.max(-15, Math.min(15, targetPos.y));
        targetPos.z = Math.max(-10, Math.min(10, targetPos.z));
        
        this.targetPosition.copy(targetPos);
    }
    
    update(deltaTime) {
        this.time += deltaTime;
        
        // Smooth follow
        this.currentPosition.lerp(this.targetPosition, this.config.followSpeed);
        
        // Add bobbing motion
        const bob = Math.sin(this.time * this.config.bobSpeed) * this.config.bobAmount;
        
        this.group.position.copy(this.currentPosition);
        this.group.position.y += bob;
        
        // Update shader uniforms
        this.innerGlow.material.uniforms.time.value = this.time;
        
        // Pulsing scale
        const pulse = 1 + Math.sin(this.time * 3) * 0.1;
        this.core.scale.setScalar(pulse);
        this.outerGlow.scale.set(
            this.config.glowRadius * 2 * pulse,
            this.config.glowRadius * 2 * pulse,
            1
        );
        
        // Update particles
        this.updateParticles(deltaTime);
        
        // Update trail
        this.updateTrail();
    }
    
    updateParticles(deltaTime) {
        const positions = this.particleSystem.geometry.attributes.position.array;
        
        for (let i = 0; i < this.config.particleCount; i++) {
            const vel = this.particleVelocities[i];
            
            // Update life
            vel.life += deltaTime;
            
            if (vel.life > vel.maxLife) {
                // Reset particle
                positions[i * 3] = 0;
                positions[i * 3 + 1] = 0;
                positions[i * 3 + 2] = 0;
                vel.life = 0;
                vel.x = (Math.random() - 0.5) * 0.04;
                vel.y = (Math.random() - 0.5) * 0.04;
                vel.z = (Math.random() - 0.5) * 0.04;
            } else {
                // Move particle
                positions[i * 3] += vel.x;
                positions[i * 3 + 1] += vel.y + 0.01; // Slight upward drift
                positions[i * 3 + 2] += vel.z;
            }
        }
        
        this.particleSystem.geometry.attributes.position.needsUpdate = true;
    }
    
    updateTrail() {
        // Store positions for trail effect (used by character following logic)
        this.trail.unshift(this.group.position.clone());
        if (this.trail.length > this.config.trailLength) {
            this.trail.pop();
        }
    }
    
    getPosition() {
        return this.group.position.clone();
    }
    
    getTrailPosition(index) {
        return this.trail[Math.min(index, this.trail.length - 1)]?.clone() || this.group.position.clone();
    }
    
    dispose() {
        this.core.geometry.dispose();
        this.core.material.dispose();
        this.innerGlow.geometry.dispose();
        this.innerGlow.material.dispose();
        this.outerGlow.material.map.dispose();
        this.outerGlow.material.dispose();
        this.particleSystem.geometry.dispose();
        this.particleSystem.material.dispose();
        this.scene.remove(this.group);
    }
}
