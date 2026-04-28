import * as THREE from 'three';
import { evolutionStages } from '../projects/ProjectsData.js';

/**
 * Character - The prismatic/oil-slick outlined figure
 * Starts as a young girl silhouette and evolves through life stages
 */
export class Character {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.currentStage = 0;
        this.morphProgress = 0;
        this.time = 0;
        this.isWalking = false;
        this.walkCycle = 0;
        
        // Animation state
        this.currentAnimation = 'idle';
        this.animationTime = 0;
        
        // Target to follow
        this.targetPosition = new THREE.Vector3(0, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        
        this.config = {
            moveSpeed: 0.03,
            baseHeight: 2,
            outlineThickness: 0.08,
        };
        
        this.bodyParts = {};
        
        this.init();
    }
    
    init() {
        // Create the prismatic/oil-slick material
        this.prismaticMaterial = this.createPrismaticMaterial();
        
        // Build initial character (child stage)
        this.buildCharacter(evolutionStages[0]);
        
        this.scene.add(this.group);
        this.group.position.set(0, -3, 0);
    }
    
    createPrismaticMaterial() {
        return new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                morphProgress: { value: 0 },
                viewVector: { value: new THREE.Vector3() },
            },
            vertexShader: `
                uniform float time;
                uniform vec3 viewVector;
                
                varying vec3 vNormal;
                varying vec3 vPosition;
                varying vec3 vWorldPosition;
                varying float vFresnel;
                
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vPosition = position;
                    
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    
                    // Calculate fresnel for edge detection
                    vec3 viewDir = normalize(cameraPosition - worldPosition.xyz);
                    vFresnel = 1.0 - abs(dot(viewDir, vNormal));
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform float morphProgress;
                
                varying vec3 vNormal;
                varying vec3 vPosition;
                varying vec3 vWorldPosition;
                varying float vFresnel;
                
                // Oil slick / prismatic color function
                vec3 oilSlickColor(float angle, float t) {
                    // Create shifting rainbow effect like oil on water
                    float hue = fract(angle * 0.5 + t * 0.3 + vWorldPosition.y * 0.1);
                    
                    // Convert hue to RGB with high saturation
                    vec3 color;
                    float h = hue * 6.0;
                    float c = 1.0;
                    float x = c * (1.0 - abs(mod(h, 2.0) - 1.0));
                    
                    if (h < 1.0) color = vec3(c, x, 0.0);
                    else if (h < 2.0) color = vec3(x, c, 0.0);
                    else if (h < 3.0) color = vec3(0.0, c, x);
                    else if (h < 4.0) color = vec3(0.0, x, c);
                    else if (h < 5.0) color = vec3(x, 0.0, c);
                    else color = vec3(c, 0.0, x);
                    
                    // Add metallic sheen
                    float metallic = pow(vFresnel, 2.0) * 0.5;
                    color = mix(color, vec3(1.0), metallic);
                    
                    return color;
                }
                
                void main() {
                    // Calculate view angle for prismatic effect
                    float angle = atan(vNormal.y, vNormal.x);
                    
                    // Get base oil slick color
                    vec3 baseColor = oilSlickColor(angle, time);
                    
                    // Edge glow effect - stronger at edges (outline effect)
                    float edgeFactor = pow(vFresnel, 1.5);
                    
                    // Create "hollow" effect by making center more transparent
                    float hollowFactor = smoothstep(0.3, 0.7, vFresnel);
                    
                    // Combine for outline effect with prismatic coloring
                    vec3 finalColor = baseColor * (0.3 + edgeFactor * 1.5);
                    
                    // Add glow at the edges
                    finalColor += baseColor * edgeFactor * 0.5;
                    
                    // Alpha: more opaque at edges, transparent in center
                    float alpha = 0.2 + edgeFactor * 0.8;
                    
                    // During morph, add extra glow
                    if (morphProgress > 0.0 && morphProgress < 1.0) {
                        float morphGlow = sin(morphProgress * 3.14159) * 0.5;
                        finalColor += vec3(1.0) * morphGlow;
                        alpha = min(1.0, alpha + morphGlow * 0.3);
                    }
                    
                    gl_FragColor = vec4(finalColor, alpha);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        });
    }
    
    /**
     * Build character geometry for a given evolution stage
     * Creates a stylized feminine figure with hollow center effect
     */
    buildCharacter(stage) {
        // Clear existing parts
        Object.values(this.bodyParts).forEach(part => {
            if (part.geometry) part.geometry.dispose();
            this.group.remove(part);
        });
        this.bodyParts = {};
        
        const traits = stage.characterTraits;
        const height = this.config.baseHeight * traits.height;
        const thickness = this.config.outlineThickness * (traits.outlineThickness / 3);
        
        // Proportions vary by age
        let headRatio, torsoRatio, legRatio, armRatio;
        
        switch (traits.proportions) {
            case 'childlike':
                headRatio = 0.28;
                torsoRatio = 0.30;
                legRatio = 0.35;
                armRatio = 0.25;
                break;
            case 'growing':
                headRatio = 0.22;
                torsoRatio = 0.32;
                legRatio = 0.40;
                armRatio = 0.30;
                break;
            case 'teen':
                headRatio = 0.18;
                torsoRatio = 0.34;
                legRatio = 0.44;
                armRatio = 0.35;
                break;
            case 'adult':
            default:
                headRatio = 0.15;
                torsoRatio = 0.35;
                legRatio = 0.46;
                armRatio = 0.38;
                break;
        }
        
        const headSize = height * headRatio;
        const torsoHeight = height * torsoRatio;
        const legHeight = height * legRatio;
        const armLength = height * armRatio;
        
        // Head - oval shape using TorusKnot for interesting geometry
        const headGeometry = new THREE.TorusGeometry(headSize * 0.5, thickness, 16, 32);
        const head = new THREE.Mesh(headGeometry, this.prismaticMaterial.clone());
        head.position.y = height - headSize * 0.5;
        head.rotation.x = Math.PI / 2;
        this.bodyParts.head = head;
        this.group.add(head);
        
        // Add head outline ring
        const headOutlineGeometry = new THREE.TorusGeometry(headSize * 0.55, thickness * 0.5, 8, 32);
        const headOutline = new THREE.Mesh(headOutlineGeometry, this.prismaticMaterial.clone());
        headOutline.position.y = height - headSize * 0.5;
        headOutline.rotation.x = Math.PI / 2;
        this.bodyParts.headOutline = headOutline;
        this.group.add(headOutline);
        
        // Neck
        const neckGeometry = new THREE.CylinderGeometry(thickness * 2, thickness * 2, headSize * 0.3, 8, 1, true);
        const neck = new THREE.Mesh(neckGeometry, this.prismaticMaterial.clone());
        neck.position.y = height - headSize - headSize * 0.15;
        this.bodyParts.neck = neck;
        this.group.add(neck);
        
        // Torso - curved lines suggesting shape without filling
        const torsoSpine = this.createSpineCurve(torsoHeight, thickness);
        torsoSpine.position.y = legHeight + torsoHeight * 0.5;
        this.bodyParts.torso = torsoSpine;
        this.group.add(torsoSpine);
        
        // Shoulders line
        const shoulderWidth = height * (traits.proportions === 'childlike' ? 0.15 : 0.2);
        const shouldersGeometry = new THREE.TorusGeometry(shoulderWidth, thickness, 8, 16, Math.PI);
        const shoulders = new THREE.Mesh(shouldersGeometry, this.prismaticMaterial.clone());
        shoulders.position.y = legHeight + torsoHeight * 0.85;
        shoulders.rotation.x = Math.PI / 2;
        shoulders.rotation.z = Math.PI;
        this.bodyParts.shoulders = shoulders;
        this.group.add(shoulders);
        
        // Hips line
        const hipWidth = height * (traits.proportions === 'adult' ? 0.18 : 0.12);
        const hipsGeometry = new THREE.TorusGeometry(hipWidth, thickness, 8, 16, Math.PI);
        const hips = new THREE.Mesh(hipsGeometry, this.prismaticMaterial.clone());
        hips.position.y = legHeight;
        hips.rotation.x = Math.PI / 2;
        this.bodyParts.hips = hips;
        this.group.add(hips);
        
        // Left Arm
        const leftArm = this.createLimb(armLength, thickness, 'arm');
        leftArm.position.set(-shoulderWidth, legHeight + torsoHeight * 0.85, 0);
        leftArm.rotation.z = 0.3;
        this.bodyParts.leftArm = leftArm;
        this.group.add(leftArm);
        
        // Right Arm
        const rightArm = this.createLimb(armLength, thickness, 'arm');
        rightArm.position.set(shoulderWidth, legHeight + torsoHeight * 0.85, 0);
        rightArm.rotation.z = -0.3;
        this.bodyParts.rightArm = rightArm;
        this.group.add(rightArm);
        
        // Left Leg
        const leftLeg = this.createLimb(legHeight, thickness, 'leg');
        leftLeg.position.set(-hipWidth * 0.5, legHeight, 0);
        this.bodyParts.leftLeg = leftLeg;
        this.group.add(leftLeg);
        
        // Right Leg
        const rightLeg = this.createLimb(legHeight, thickness, 'leg');
        rightLeg.position.set(hipWidth * 0.5, legHeight, 0);
        this.bodyParts.rightLeg = rightLeg;
        this.group.add(rightLeg);
    }
    
    createSpineCurve(height, thickness) {
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, -height * 0.5, 0),
            new THREE.Vector3(0, -height * 0.2, 0.05),
            new THREE.Vector3(0, height * 0.1, 0),
            new THREE.Vector3(0, height * 0.4, -0.05),
        ]);
        
        const geometry = new THREE.TubeGeometry(curve, 16, thickness, 8, false);
        return new THREE.Mesh(geometry, this.prismaticMaterial.clone());
    }
    
    createLimb(length, thickness, type) {
        const group = new THREE.Group();
        
        // Create curved limb using tube geometry
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, -length * 0.5, type === 'arm' ? 0.1 : 0),
            new THREE.Vector3(0, -length, type === 'arm' ? 0.15 : 0.05),
        ]);
        
        const geometry = new THREE.TubeGeometry(curve, 12, thickness, 6, false);
        const limb = new THREE.Mesh(geometry, this.prismaticMaterial.clone());
        group.add(limb);
        
        return group;
    }
    
    /**
     * Evolve to the next character stage
     */
    evolve() {
        if (this.currentStage >= evolutionStages.length - 1) return false;
        
        const nextStage = this.currentStage + 1;
        
        // Trigger morph animation
        this.startMorph(evolutionStages[nextStage]);
        this.currentStage = nextStage;
        
        return true;
    }
    
    startMorph(targetStage) {
        // Animate morph progress
        const duration = 2000; // 2 seconds
        const startTime = Date.now();
        
        const animateMorph = () => {
            const elapsed = Date.now() - startTime;
            this.morphProgress = Math.min(elapsed / duration, 1);
            
            // Update shader uniform
            Object.values(this.bodyParts).forEach(part => {
                if (part.material && part.material.uniforms) {
                    part.material.uniforms.morphProgress.value = this.morphProgress;
                }
            });
            
            if (this.morphProgress < 1) {
                requestAnimationFrame(animateMorph);
            } else {
                // Rebuild character at new stage
                this.buildCharacter(targetStage);
                this.morphProgress = 0;
            }
        };
        
        animateMorph();
    }
    
    /**
     * Set position to follow (the glow orb position)
     */
    setTarget(position) {
        this.targetPosition.copy(position);
    }
    
    /**
     * Update character each frame
     */
    update(deltaTime) {
        this.time += deltaTime;
        
        // Update shader time uniforms
        Object.values(this.bodyParts).forEach(part => {
            if (part.material && part.material.uniforms) {
                part.material.uniforms.time.value = this.time;
            }
        });
        
        // Movement toward target
        const direction = new THREE.Vector3()
            .subVectors(this.targetPosition, this.group.position);
        direction.y = 0; // Keep on ground plane
        
        const distance = direction.length();
        
        if (distance > 0.5) {
            // Moving
            direction.normalize();
            
            const moveSpeed = this.config.moveSpeed;
            this.velocity.lerp(direction.multiplyScalar(moveSpeed), 0.1);
            
            // "Walking in place" effect - move forward but drift back
            const effectiveMove = this.velocity.clone();
            effectiveMove.multiplyScalar(0.3); // Only move 30% of intended distance
            
            this.group.position.add(effectiveMove);
            
            // Face direction of movement
            if (direction.length() > 0.01) {
                const angle = Math.atan2(direction.x, direction.z);
                this.group.rotation.y = THREE.MathUtils.lerp(
                    this.group.rotation.y,
                    angle,
                    0.05
                );
            }
            
            this.isWalking = true;
            this.animateWalking(deltaTime);
        } else {
            this.isWalking = false;
            this.animateIdle(deltaTime);
        }
        
        // Subtle breathing/floating animation
        const breathe = Math.sin(this.time * 2) * 0.02;
        this.group.position.y = -3 + breathe;
    }
    
    animateWalking(deltaTime) {
        this.walkCycle += deltaTime * 5;
        
        // Leg swing
        if (this.bodyParts.leftLeg) {
            this.bodyParts.leftLeg.rotation.x = Math.sin(this.walkCycle) * 0.4;
        }
        if (this.bodyParts.rightLeg) {
            this.bodyParts.rightLeg.rotation.x = Math.sin(this.walkCycle + Math.PI) * 0.4;
        }
        
        // Arm swing (opposite to legs)
        if (this.bodyParts.leftArm) {
            this.bodyParts.leftArm.rotation.x = Math.sin(this.walkCycle + Math.PI) * 0.3;
        }
        if (this.bodyParts.rightArm) {
            this.bodyParts.rightArm.rotation.x = Math.sin(this.walkCycle) * 0.3;
        }
        
        // Body bob
        const bobAmount = Math.abs(Math.sin(this.walkCycle * 2)) * 0.05;
        this.group.position.y = -3 + bobAmount;
    }
    
    animateIdle(deltaTime) {
        // Subtle sway
        const sway = Math.sin(this.time * 1.5) * 0.02;
        this.group.rotation.z = sway;
        
        // Return limbs to rest
        ['leftLeg', 'rightLeg', 'leftArm', 'rightArm'].forEach(limb => {
            if (this.bodyParts[limb]) {
                this.bodyParts[limb].rotation.x *= 0.95;
            }
        });
    }
    
    getCurrentStage() {
        return this.currentStage;
    }
    
    getPosition() {
        return this.group.position.clone();
    }
    
    dispose() {
        Object.values(this.bodyParts).forEach(part => {
            if (part.geometry) part.geometry.dispose();
            if (part.material) part.material.dispose();
        });
        this.scene.remove(this.group);
    }
}
