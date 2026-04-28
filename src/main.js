import { SceneManager } from './scene/SceneManager.js';
import { projects } from './projects/ProjectsData.js';

/**
 * Main Application Entry Point
 * Initializes the scene and handles UI interactions
 */
class App {
    constructor() {
        this.sceneManager = null;
        this.currentStage = 0;
        
        this.init();
    }
    
    async init() {
        // Create custom cursor elements
        this.createCustomCursor();
        
        // Initialize scene
        const container = document.getElementById('canvas-container');
        this.sceneManager = new SceneManager(container);
        
        // Set up callbacks
        this.sceneManager.onProjectClick = (project) => this.openProjectModal(project);
        this.sceneManager.onCharacterEvolve = (stage) => this.onCharacterEvolve(stage);
        
        // Simulate loading
        await this.simulateLoading();
        
        // Show intro screen
        this.showIntroScreen();
        
        // Set up UI event listeners
        this.setupUIListeners();
    }
    
    createCustomCursor() {
        const cursor = document.createElement('div');
        cursor.className = 'custom-cursor';
        document.body.appendChild(cursor);
        
        const cursorGlow = document.createElement('div');
        cursorGlow.className = 'cursor-glow';
        document.body.appendChild(cursorGlow);
    }
    
    async simulateLoading() {
        return new Promise((resolve) => {
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 15;
                progress = Math.min(progress, 100);
                
                this.sceneManager.setLoadingProgress(progress);
                
                if (progress >= 100) {
                    clearInterval(interval);
                    setTimeout(resolve, 500);
                }
            }, 200);
        });
    }
    
    showIntroScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const introScreen = document.getElementById('intro-screen');
        
        loadingScreen.classList.remove('active');
        
        setTimeout(() => {
            introScreen.classList.add('active');
        }, 500);
        
        // Click to start
        introScreen.addEventListener('click', () => {
            introScreen.classList.remove('active');
            this.sceneManager.startExperience();
        }, { once: true });
    }
    
    setupUIListeners() {
        // Project revealed event
        window.addEventListener('projectRevealed', (e) => {
            console.log('Project revealed:', e.detail.project.title);
        });
        
        // Lights on event
        window.addEventListener('lightsOn', () => {
            document.body.classList.add('lights-on');
        });
        
        // Modal close
        document.querySelector('.modal-close')?.addEventListener('click', () => {
            this.closeProjectModal();
        });
        
        document.querySelector('.modal-backdrop')?.addEventListener('click', () => {
            this.closeProjectModal();
        });
        
        // About panel
        document.querySelector('.about-btn')?.addEventListener('click', () => {
            document.getElementById('about-panel')?.classList.add('active');
        });
        
        // Contact panel
        document.querySelector('.contact-btn')?.addEventListener('click', () => {
            document.getElementById('contact-panel')?.classList.add('active');
        });
        
        // Panel close buttons
        document.querySelectorAll('.panel-close').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.panel').forEach(panel => {
                    panel.classList.remove('active');
                });
            });
        });
        
        // Contact form
        document.getElementById('contact-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            // Handle form submission
            alert('Message sent! (This would normally send to a backend)');
            document.getElementById('contact-panel')?.classList.remove('active');
        });
        
        // Escape key to close modals
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeProjectModal();
                document.querySelectorAll('.panel').forEach(panel => {
                    panel.classList.remove('active');
                });
            }
        });
    }
    
    openProjectModal(project) {
        const modal = document.getElementById('project-modal');
        
        // Populate modal content
        modal.querySelector('.project-tag').textContent = project.tag;
        modal.querySelector('.project-title').textContent = project.title;
        modal.querySelector('.project-description').textContent = project.description;
        
        // Technologies
        const techList = modal.querySelector('.tech-list');
        techList.innerHTML = project.technologies
            .map(tech => `<li>${tech}</li>`)
            .join('');
        
        // Links
        const demoLink = modal.querySelector('.project-demo');
        const codeLink = modal.querySelector('.project-code');
        
        demoLink.href = project.demoUrl;
        codeLink.href = project.codeUrl;
        
        // Preview (placeholder for now)
        const preview = modal.querySelector('.project-preview');
        preview.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: rgba(255,255,255,0.3);">Preview Image</div>`;
        
        // Show modal
        modal.classList.add('active');
    }
    
    closeProjectModal() {
        document.getElementById('project-modal')?.classList.remove('active');
    }
    
    onCharacterEvolve(stage) {
        this.currentStage = stage;
        
        // Update progress indicator
        const stages = document.querySelectorAll('.stage');
        stages.forEach((stageEl, index) => {
            if (index < stage) {
                stageEl.classList.add('completed');
                stageEl.classList.remove('active');
            } else if (index === stage) {
                stageEl.classList.add('active');
                stageEl.classList.remove('completed');
            } else {
                stageEl.classList.remove('active', 'completed');
            }
        });
        
        // Check if final stage - trigger lights
        if (stage === 3) {
            setTimeout(() => {
                this.sceneManager.triggerLightsOn();
            }, 2000);
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
