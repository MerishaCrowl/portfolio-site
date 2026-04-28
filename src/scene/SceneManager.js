import * as THREE from 'three';
import { StarField } from './StarField.js';
import { GlowOrb } from './GlowOrb.js';
import { Character } from './Character.js';
import { ProjectObject } from './ProjectObject.js';
import { projects } from '../projects/ProjectsData.js';

/**
 * SceneManager - Orchestrates all scene elements
 * Handles initialization, updates, and interactions
 */
export class SceneManager {
    constructor(container) {
        this.container = container;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        // Core Three.js components
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        
        // Scene elements
        this.starField = null;
        this.glowOrb = null;
        this.character = null;
        this.projectObjects = [];
        
        // Interaction
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();
        this.hoveredProject = null;
        
        // State
        this.isRunning = false;
        this.isIntroComplete = false;
        this.lightsOn = false;
        this.clock = new THREE.Timer();
        
        // Callbacks
        this.onProjectClick = null;
        this.onCharacterEvolve = null;
        
        this.init();
    }
    
    init() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        this.scene.fog = new THREE.FogExp2(0x000000, 0.008);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(
            60,
            this.width / this.height,
            0.1,
            1000
        );
        this.camera.position.set(0, 2, 15);
        this.camera.lookAt(0, 0, 0);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: false,
        });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1;
        this.container.appendChild(this.renderer.domElement);
        
        // Initialize scene elements
        this.starField = new StarField(this.scene);
        this.glowOrb = new GlowOrb(this.scene);
        this.character = new Character(this.scene);
        
        // Create project objects
        projects.forEach(projectData => {
            const projectObject = new ProjectObject(this.scene, projectData);
            this.projectObjects.push(projectObject);
        });
        
        // Ambient light (very dim)
        const ambientLight = new THREE.AmbientLight(0x111122, 0.1);
        this.scene.add(ambientLight);
        
        // Event listeners
        this.setupEventListeners();
        
        // Start render loop
        this.isRunning = true;
        this.animate();
    }
    
    setupEventListeners() {
        // Mouse move
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = (e.clientX / this.width) * 2 - 1;
            this.mouse.y = -(e.clientY / this.height) * 2 + 1;
            
            if (this.isIntroComplete) {
                this.glowOrb.setTargetFromMouse(this.mouse.x, this.mouse.y, this.camera);
                this.updateCursor(e.clientX, e.clientY);
            }
        });
        
        // Click
        window.addEventListener('click', (e) => {
            if (!this.isIntroComplete) return;
            
            // Check if clicking on a project
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const clickableObjects = this.projectObjects.map(p => p.getClickableMesh());
            const intersects = this.raycaster.intersectObjects(clickableObjects);
            
            if (intersects.length > 0) {
                const clickedObject = intersects[0].object;
                const project = this.projectObjects.find(p => p.getClickableMesh() === clickedObject);
                
                if (project && project.isRevealed) {
                    this.onProjectClick?.(project.data);
                }
            } else {
                // Click in empty space - evolve character
                this.evolveCharacter();
            }
        });
        
        // Resize
        window.addEventListener('resize', () => this.onResize());
    }
    
    updateCursor(x, y) {
        // Update custom cursor position
        const cursor = document.querySelector('.custom-cursor');
        const cursorGlow = document.querySelector('.cursor-glow');
        
        if (cursor) {
            cursor.style.left = `${x}px`;
            cursor.style.top = `${y}px`;
        }
        
        if (cursorGlow) {
            cursorGlow.style.left = `${x}px`;
            cursorGlow.style.top = `${y}px`;
        }
    }
    
    checkProjectHover() {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const clickableObjects = this.projectObjects.map(p => p.getClickableMesh());
        const intersects = this.raycaster.intersectObjects(clickableObjects);
        
        // Reset previous hover
        if (this.hoveredProject) {
            this.hoveredProject.setHovered(false);
        }
        
        if (intersects.length > 0) {
            const hoveredObject = intersects[0].object;
            const project = this.projectObjects.find(p => p.getClickableMesh() === hoveredObject);
            
            if (project && project.isRevealed) {
                project.setHovered(true);
                this.hoveredProject = project;
                
                // Update cursor style
                document.querySelector('.custom-cursor')?.classList.add('hovering');
            } else {
                this.hoveredProject = null;
                document.querySelector('.custom-cursor')?.classList.remove('hovering');
            }
        } else {
            this.hoveredProject = null;
            document.querySelector('.custom-cursor')?.classList.remove('hovering');
        }
    }
    
    evolveCharacter() {
        const evolved = this.character.evolve();
        if (evolved) {
            this.onCharacterEvolve?.(this.character.getCurrentStage());
        }
    }
    
    startExperience() {
        this.isIntroComplete = true;
        this.glowOrb.show();
        
        // Show UI elements
        document.getElementById('nav-hints')?.classList.add('visible');
        document.getElementById('journey-progress')?.classList.add('visible');
    }
    
    async triggerLightsOn() {
        this.lightsOn = true;
        
        // Fade out stars
        await this.starField.revealEnvironment(3);
        
        // Reveal environment
        this.scene.background = new THREE.Color(0x1a1a2e);
        this.scene.fog = new THREE.FogExp2(0x1a1a2e, 0.02);
        
        // Add environment lights
        const envLight = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(envLight);
        
        const spotLight = new THREE.SpotLight(0xffffff, 1);
        spotLight.position.set(0, 20, 10);
        spotLight.angle = Math.PI / 4;
        spotLight.penumbra = 0.5;
        this.scene.add(spotLight);
        
        // Dispatch event for UI
        window.dispatchEvent(new CustomEvent('lightsOn'));
    }
    
    animate() {
        if (!this.isRunning) return;
        
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = this.clock.getDelta();
        
        // Update scene elements
        this.starField.update(deltaTime);
        
        if (this.isIntroComplete) {
            this.glowOrb.update(deltaTime);
            
            // Character follows the orb
            this.character.setTarget(this.glowOrb.getPosition());
            this.character.update(deltaTime);
            
            // Update project objects
            const characterPos = this.character.getPosition();
            this.projectObjects.forEach(project => {
                project.checkProximity(characterPos);
                project.update(deltaTime);
            });
            
            // Check hover state
            this.checkProjectHover();
        }
        
        // Render
        this.renderer.render(this.scene, this.camera);
    }
    
    onResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(this.width, this.height);
        
        this.starField.onResize();
    }
    
    // Loading progress (called by main.js)
    setLoadingProgress(progress) {
        const progressBar = document.querySelector('.progress-bar');
        const percentage = document.querySelector('.loader-percentage');
        
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
        if (percentage) {
            percentage.textContent = `${Math.round(progress)}%`;
        }
    }
    
    dispose() {
        this.isRunning = false;
        
        this.starField.dispose();
        this.glowOrb.dispose();
        this.character.dispose();
        this.projectObjects.forEach(p => p.dispose());
        
        this.renderer.dispose();
        this.container.removeChild(this.renderer.domElement);
    }
}
