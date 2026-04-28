/**
 * Projects Data
 * Add your projects here. Each project will appear as a discoverable object in the scene.
 * The order determines when they appear in the journey.
 */

export const projects = [
    {
        id: 'restaurant-landing',
        title: "Doughby's Kitchen",
        tag: 'Front-End Development',
        description: 'A warm, playful restaurant landing page featuring claymation-inspired Three.js animations, scroll-triggered effects, and an inviting family-friendly aesthetic.',
        technologies: ['Three.js', 'HTML/CSS', 'JavaScript', 'GSAP'],
        demoUrl: '#', // Replace with your deployed URL
        codeUrl: '#', // Replace with your GitHub repo
        previewImage: '/images/project-restaurant.jpg', // Add image to public/images
        // Scene object configuration
        sceneObject: {
            type: 'pizza', // What 3D object represents this project
            position: { x: -15, y: 0, z: -20 },
            haloColor: 0xF4A261, // Warm orange glow
        },
        // Character evolution this project triggers
        evolution: {
            description: 'First steps into creative development',
            ageProgression: 0.15, // 15% through the journey
        }
    },
    {
        id: 'dev-dashboard',
        title: 'DevDash',
        tag: 'Full-Stack Application',
        description: 'A sleek developer productivity dashboard with task management, time tracking, and real-time data sync via Supabase. Features dark/light themes and a modern, minimal interface.',
        technologies: ['React', 'Supabase', 'Node.js', 'Tailwind CSS'],
        demoUrl: '#',
        codeUrl: '#',
        previewImage: '/images/project-dashboard.jpg',
        sceneObject: {
            type: 'monitor',
            position: { x: 0, y: 0, z: -25 },
            haloColor: 0x6366f1, // Indigo glow
        },
        evolution: {
            description: 'Building real tools for real problems',
            ageProgression: 0.35,
        }
    },
    {
        id: 'cookie-store',
        title: 'NeonByte Cookies',
        tag: 'E-Commerce Design',
        description: 'A cyberpunk-themed cookie shop targeting late-night gamers. Features neon aesthetics, animated interactions, and a playful gamer-centric shopping experience.',
        technologies: ['HTML/CSS', 'JavaScript', 'GSAP', 'Responsive Design'],
        demoUrl: '#',
        codeUrl: '#',
        previewImage: '/images/project-cookies.jpg',
        sceneObject: {
            type: 'cookie',
            position: { x: 18, y: 0, z: -22 },
            haloColor: 0xff2d95, // Neon pink glow
        },
        evolution: {
            description: 'Finding voice through bold design choices',
            ageProgression: 0.55,
        }
    }
];

export const projects = [
    // ... existing projects
    {
        id: 'new-project',
        title: 'New Project Name',
        tag: 'Category',
        description: 'Description here...',
        technologies: ['Tech1', 'Tech2'],
        demoUrl: 'https://...',
        codeUrl: '[github.com](https://github.com/)',
        previewImage: '/images/new-project.jpg',
        sceneObject: {
            type: 'custom', // Add new types in ProjectObject.js
            position: { x: 10, y: 0, z: -30 },
            haloColor: 0x00ff00,
        },
        evolution: {
            description: 'What this project represents',
            ageProgression: 0.75,
        }
    }
];

/**
 * Easter eggs and hidden elements that appear when lights turn on
 */
export const easterEggs = [
    {
        id: 'coffee-cup',
        type: 'decorative',
        tooltip: 'Fuel for late nights',
        position: { x: -25, y: -5, z: -15 },
    },
    {
        id: 'plant',
        type: 'decorative', 
        tooltip: 'A reminder to take breaks',
        position: { x: 30, y: 0, z: -18 },
    },
    {
        id: 'book-stack',
        type: 'link',
        tooltip: 'Learning never stops',
        url: '/reading-list',
        position: { x: -20, y: 2, z: -30 },
    },
    {
        id: 'game-controller',
        type: 'decorative',
        tooltip: 'Work-life balance',
        position: { x: 22, y: -3, z: -25 },
    }
];

/**
 * Character evolution stages
 * Each stage represents a phase of the journey
 */
export const evolutionStages = [
    {
        id: 0,
        name: 'Beginning',
        ageAppearance: 'child', // ~8-10 years
        description: 'Taking first steps into the unknown',
        characterTraits: {
            height: 0.6, // Relative to adult height
            proportions: 'childlike', // Larger head ratio
            movementStyle: 'curious', // Skipping, looking around
            outlineThickness: 3,
        },
        animations: ['skip', 'look_around', 'play', 'stumble'],
    },
    {
        id: 1,
        name: 'Discovery',
        ageAppearance: 'preteen', // ~12-14 years
        description: 'Finding passion in the craft',
        characterTraits: {
            height: 0.75,
            proportions: 'growing',
            movementStyle: 'determined',
            outlineThickness: 3.5,
        },
        animations: ['walk_purposeful', 'reach', 'examine', 'nod'],
    },
    {
        id: 2,
        name: 'Growth',
        ageAppearance: 'teen', // ~16-18 years
        description: 'Building confidence and skills',
        characterTraits: {
            height: 0.9,
            proportions: 'teen',
            movementStyle: 'confident',
            outlineThickness: 4,
        },
        animations: ['stride', 'gesture', 'create', 'celebrate'],
    },
    {
        id: 3,
        name: 'Revelation',
        ageAppearance: 'young_adult', // ~20-25 years
        description: 'Seeing the full picture',
        characterTraits: {
            height: 1.0,
            proportions: 'adult',
            movementStyle: 'assured',
            outlineThickness: 4.5,
        },
        animations: ['walk_confident', 'present', 'illuminate', 'welcome'],
    }
];
