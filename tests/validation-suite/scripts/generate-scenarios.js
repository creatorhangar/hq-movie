#!/usr/bin/env node
/**
 * HQ Movie - Validation Suite Generator
 * Generates 28 test projects (4 formats × 7 scenarios)
 * 
 * FORMATS: vertical (9:16), widescreen (16:9), square (1:1), portrait (4:3)
 * SCENARIOS: simple, narrative, action, dialogue, epic, minimal, complete
 */

const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const VIDEO_FORMATS = {
    vertical: { id: 'vertical', name: 'Vertical 9:16', width: 1080, height: 1920, ratio: '9:16' },
    widescreen: { id: 'widescreen', name: 'Widescreen 16:9', width: 1920, height: 1080, ratio: '16:9' },
    square: { id: 'square', name: 'Square 1:1', width: 1080, height: 1080, ratio: '1:1' },
    portrait: { id: 'portrait', name: 'Portrait 4:3', width: 1440, height: 1080, ratio: '4:3' }
};

const SCENARIOS = {
    simple: {
        id: 'simple',
        name: 'Simples',
        pages: 1,
        description: '1 página, sem áudio, sem animação',
        audio: false,
        animation: 'static',
        transition: 'none'
    },
    narrative: {
        id: 'narrative',
        name: 'Narrativa',
        pages: 3,
        description: '3 páginas, narração, fade',
        audio: true,
        animation: ['zoomIn', 'panRight', 'zoomOut'],
        transition: 'fade'
    },
    action: {
        id: 'action',
        name: 'Ação',
        pages: 5,
        description: '5 páginas, música, zoom/pan',
        audio: 'music',
        animation: ['panLeft', 'zoomIn', 'panRight', 'zoomOut', 'float'],
        transition: 'slide'
    },
    dialogue: {
        id: 'dialogue',
        name: 'Diálogo',
        pages: 4,
        description: '4 páginas, balões variados, whisper/shout',
        audio: false,
        animation: 'static',
        transition: 'cut'
    },
    epic: {
        id: 'epic',
        name: 'Épico',
        pages: 6,
        description: '6 páginas, tudo ativado',
        audio: true,
        animation: ['zoomIn', 'panLeft', 'zoomOut', 'panRight', 'panUp', 'float'],
        transition: ['fade', 'slide', 'fade', 'cut', 'slide', 'fade']
    },
    minimal: {
        id: 'minimal',
        name: 'Minimal',
        pages: 2,
        description: '2 páginas, só imagens, cut',
        audio: false,
        animation: ['zoomIn', 'zoomOut'],
        transition: 'cut'
    },
    complete: {
        id: 'complete',
        name: 'Completo',
        pages: 8,
        description: '8 páginas, todos tipos de balão, todos efeitos',
        audio: true,
        animation: ['static', 'zoomIn', 'zoomOut', 'panLeft', 'panRight', 'panUp', 'float', 'static'],
        transition: 'fade'
    }
};

const LAYOUTS = {
    vertical: {
        full: 'v1-splash',
        duo: 'v2-dual',
        triple: 'v3-triple',
        quad: 'v4-grid'
    },
    widescreen: {
        full: 'w1-cinematic',
        duo: 'w2-split',
        triple: 'w3-hero',
        quad: 'w4-grid'
    },
    square: {
        full: 's1-full',
        duo: 's4-hsplit',
        triple: 's3-lshape',
        quad: 's2-grid'
    },
    portrait: {
        full: 'p1-full',
        duo: 'p2-split',
        triple: 'p3-trio',
        quad: 'p4-grid'
    }
};

const BALLOON_TEXTS = {
    simple: {
        vertical: "Bem-vindo ao teste!",
        widescreen: "Este é um vídeo widescreen.",
        square: "Formato quadrado testado.",
        portrait: "Retrato 4:3 funcionando."
    },
    dialogue: [
        { type: 'speech', char: 'A', text: "Olá! Como vai?" },
        { type: 'speech', char: 'B', text: "Vou bem, e você?" },
        { type: 'thought', char: 'A', text: "(Ele parece nervoso...)" },
        { type: 'whisper', char: 'B', text: "Preciso te contar um segredo." },
        { type: 'shout', char: 'A', text: "O QUÊ?!" },
        { type: 'speech', char: 'B', text: "Sim, é verdade." },
        { type: 'speech', char: 'A', text: "Incrível!" },
        { type: 'thought', char: 'B', text: "(Missão cumprida.)" }
    ],
    narrative: [
        { embaixo: "Era uma vez, em uma cidade distante...", balao: "Nossa história começa aqui." },
        { embaixo: "O herói enfrenta seu primeiro desafio.", balao: "Mas nada seria fácil." },
        { embaixo: "E assim, a jornada começa.", balao: "Continua..." }
    ],
    action: [
        ["BOOM!", "CRASH!"],
        ["POW!", "BAM!"],
        ["SWOOSH!", "WHAM!"],
        ["KABOOM!", "SMASH!"],
        ["BANG!", "THUD!"]
    ]
};

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function genId() {
    return 'id_' + Math.random().toString(36).substr(2, 9);
}

function getLayout(formatId, layoutType) {
    return LAYOUTS[formatId][layoutType] || LAYOUTS[formatId].full;
}

function createBalloon(type, text, format, options = {}) {
    const w = format.width;
    const h = format.height;
    
    const defaults = {
        speech: { font: 'comic', fontSize: 16, direction: 's' },
        thought: { font: 'marker', fontSize: 14, direction: 'se' },
        shout: { font: 'comic', fontSize: 18, direction: 's' },
        whisper: { font: 'sans', fontSize: 12, direction: 'sw' },
        narration: { font: 'serif', fontSize: 14, direction: 'center', snapPosition: 'bottom' },
        sfx: { font: 'sans', fontSize: 24, direction: 'center' }
    };
    
    const cfg = defaults[type] || defaults.speech;
    
    return {
        id: genId(),
        type: type,
        text: text,
        x: options.x || Math.round(w * 0.1),
        y: options.y || Math.round(h * 0.1),
        w: options.w || Math.round(w * 0.25),
        h: options.h || 100,
        direction: cfg.direction,
        font: cfg.font,
        fontSize: cfg.fontSize,
        color: '#000000',
        ...options
    };
}

// ═══════════════════════════════════════════════════════════════
// SCENARIO GENERATORS
// ═══════════════════════════════════════════════════════════════

function createSimpleProject(formatId, format) {
    return {
        id: genId(),
        metadata: {
            name: `SIMPLE-${formatId.toUpperCase()}`,
            createdAt: Date.now(),
            updatedAt: Date.now()
        },
        videoFormat: formatId,
        backgroundMusic: null,
        videoAudio: { ducking: { enabled: false } },
        customLayouts: [],
        favoriteLayoutId: null,
        pages: [{
            id: genId(),
            layoutId: getLayout(formatId, 'full'),
            kenBurns: 'static',
            duration: 4,
            durationLocked: false,
            narration: null,
            transition: 'none',
            images: [],
            texts: [
                createBalloon('speech', BALLOON_TEXTS.simple[formatId], format, {
                    x: Math.round(format.width * 0.25),
                    y: Math.round(format.height * 0.4),
                    w: Math.round(format.width * 0.5),
                    h: 120
                })
            ],
            showTextBelow: false,
            narrative: ''
        }]
    };
}

function createNarrativeProject(formatId, format) {
    const pages = [];
    const layouts = ['full', 'duo', 'full'];
    const animations = ['zoomIn', 'panRight', 'zoomOut'];
    
    for (let i = 0; i < 3; i++) {
        const narr = BALLOON_TEXTS.narrative[i];
        const audioFile = `../../test-audio/narr-pt-0${i + 1}.wav`;
        
        pages.push({
            id: genId(),
            layoutId: getLayout(formatId, layouts[i]),
            kenBurns: animations[i],
            duration: 4 + i, // 4s, 5s, 6s
            durationLocked: false,
            narration: {
                'pt-BR': { file: audioFile, volume: 1.0 }
            },
            transition: 'fade',
            images: [],
            texts: [
                createBalloon('narration', narr.balao, format, {
                    x: Math.round(format.width * 0.1),
                    y: Math.round(format.height * 0.7),
                    w: Math.round(format.width * 0.8),
                    h: 100,
                    snapPosition: 'bottom'
                })
            ],
            showTextBelow: true,
            narrative: narr.embaixo
        });
    }
    
    return {
        id: genId(),
        metadata: {
            name: `NARRATIVE-${formatId.toUpperCase()}`,
            createdAt: Date.now(),
            updatedAt: Date.now()
        },
        videoFormat: formatId,
        videoAudio: { 
            ducking: { enabled: true, level: 0.2, fadeMs: 500 }
        },
        backgroundMusic: null,
        activeLanguage: 'pt-BR',
        narrativeMode: 'per-page',
        customLayouts: [],
        favoriteLayoutId: null,
        pages: pages
    };
}

function createActionProject(formatId, format) {
    const pages = [];
    const layouts = ['full', 'duo', 'triple', 'quad', 'full'];
    const animations = ['panLeft', 'zoomIn', 'panRight', 'zoomOut', 'float'];
    const transitions = ['slide', 'slide', 'slide', 'slide', 'fade'];
    
    for (let i = 0; i < 5; i++) {
        const sfxPair = BALLOON_TEXTS.action[i];
        pages.push({
            id: genId(),
            layoutId: getLayout(formatId, layouts[i]),
            kenBurns: animations[i],
            duration: 5,
            durationLocked: false,
            narration: null,
            transition: transitions[i],
            images: [],
            texts: [
                createBalloon('sfx', sfxPair[0], format, {
                    x: Math.round(format.width * 0.15),
                    y: Math.round(format.height * 0.2),
                    w: 200,
                    h: 80
                }),
                createBalloon('sfx', sfxPair[1], format, {
                    x: Math.round(format.width * 0.55),
                    y: Math.round(format.height * 0.6),
                    w: 200,
                    h: 80
                })
            ],
            showTextBelow: false,
            narrative: ''
        });
    }
    
    return {
        id: genId(),
        metadata: {
            name: `ACTION-${formatId.toUpperCase()}`,
            createdAt: Date.now(),
            updatedAt: Date.now()
        },
        videoFormat: formatId,
        backgroundMusic: { 
            file: '../../test-audio/music-action.wav', 
            volume: 0.6,
            loop: true
        },
        videoAudio: {
            ducking: { enabled: true, level: 0.3 }
        },
        customLayouts: [],
        favoriteLayoutId: null,
        pages: pages
    };
}

function createDialogueProject(formatId, format) {
    const pages = [];
    const dialogues = BALLOON_TEXTS.dialogue;
    
    for (let i = 0; i < 4; i++) {
        const d1 = dialogues[i * 2];
        const d2 = dialogues[i * 2 + 1];
        
        pages.push({
            id: genId(),
            layoutId: getLayout(formatId, 'duo'),
            kenBurns: 'static',
            duration: 6,
            durationLocked: false,
            narration: null,
            transition: 'cut',
            images: [],
            texts: [
                createBalloon(d1.type, d1.text, format, {
                    x: Math.round(format.width * 0.05),
                    y: Math.round(format.height * 0.15),
                    w: Math.round(format.width * 0.4),
                    h: 100
                }),
                createBalloon(d2.type, d2.text, format, {
                    x: Math.round(format.width * 0.55),
                    y: Math.round(format.height * 0.55),
                    w: Math.round(format.width * 0.4),
                    h: 100
                })
            ],
            showTextBelow: false,
            narrative: ''
        });
    }
    
    return {
        id: genId(),
        metadata: {
            name: `DIALOGUE-${formatId.toUpperCase()}`,
            createdAt: Date.now(),
            updatedAt: Date.now()
        },
        videoFormat: formatId,
        videoAudio: { ducking: { enabled: false } },
        backgroundMusic: null,
        customLayouts: [],
        favoriteLayoutId: null,
        pages: pages
    };
}

function createEpicProject(formatId, format) {
    const pages = [];
    const layouts = ['full', 'duo', 'triple', 'quad', 'quad', 'full'];
    const animations = ['zoomIn', 'panLeft', 'zoomOut', 'panRight', 'panUp', 'float'];
    const transitions = ['fade', 'slide', 'fade', 'cut', 'slide', 'fade'];
    const durations = [5, 6, 7, 5, 6, 5];
    
    const epicTexts = [
        { type: 'narration', text: 'O destino aguarda...' },
        { type: 'speech', text: 'Precisamos agir agora!' },
        { type: 'thought', text: '(Será que conseguiremos?)' },
        { type: 'sfx', text: 'KABOOM!' },
        { type: 'whisper', text: 'Silêncio...' },
        { type: 'shout', text: 'VITÓRIA!' }
    ];
    
    for (let i = 0; i < 6; i++) {
        const hasNarration = [0, 2, 5].includes(i);
        const narrFile = `../../test-audio/narr-pt-0${(i % 3) + 1}.wav`;
        
        pages.push({
            id: genId(),
            layoutId: getLayout(formatId, layouts[i]),
            kenBurns: animations[i],
            duration: durations[i],
            durationLocked: false,
            narration: hasNarration ? { 'pt-BR': { file: narrFile, volume: 1.0 } } : null,
            transition: transitions[i],
            images: [],
            texts: [
                createBalloon(epicTexts[i].type, epicTexts[i].text, format, {
                    x: Math.round(format.width * 0.2),
                    y: Math.round(format.height * 0.3),
                    w: Math.round(format.width * 0.6),
                    h: 120
                })
            ],
            showTextBelow: i === 0,
            narrative: i === 0 ? 'A épica jornada começa...' : ''
        });
    }
    
    return {
        id: genId(),
        metadata: {
            name: `EPIC-${formatId.toUpperCase()}`,
            createdAt: Date.now(),
            updatedAt: Date.now()
        },
        videoFormat: formatId,
        backgroundMusic: { 
            file: '../../test-audio/music-epic.wav', 
            volume: 0.5,
            loop: true
        },
        videoAudio: { 
            ducking: { enabled: true, level: 0.15, fadeMs: 800 }
        },
        activeLanguage: 'pt-BR',
        customLayouts: [],
        favoriteLayoutId: null,
        pages: pages
    };
}

function createMinimalProject(formatId, format) {
    return {
        id: genId(),
        metadata: {
            name: `MINIMAL-${formatId.toUpperCase()}`,
            createdAt: Date.now(),
            updatedAt: Date.now()
        },
        videoFormat: formatId,
        backgroundMusic: null,
        videoAudio: { ducking: { enabled: false } },
        customLayouts: [],
        favoriteLayoutId: null,
        pages: [
            {
                id: genId(),
                layoutId: getLayout(formatId, 'full'),
                kenBurns: 'zoomIn',
                duration: 8,
                durationLocked: false,
                narration: null,
                transition: 'cut',
                images: [],
                texts: [],
                showTextBelow: false,
                narrative: ''
            },
            {
                id: genId(),
                layoutId: getLayout(formatId, 'full'),
                kenBurns: 'zoomOut',
                duration: 8,
                durationLocked: false,
                narration: null,
                transition: 'cut',
                images: [],
                texts: [],
                showTextBelow: false,
                narrative: ''
            }
        ]
    };
}

function createCompleteProject(formatId, format) {
    const pages = [];
    const layouts = ['full', 'duo', 'triple', 'quad', 'full', 'duo', 'triple', 'full'];
    const animations = ['static', 'zoomIn', 'zoomOut', 'panLeft', 'panRight', 'panUp', 'float', 'static'];
    const balloonTypes = ['speech', 'thought', 'shout', 'whisper', 'narration', 'sfx', 'speech', 'narration'];
    const durations = [4, 5, 6, 5, 7, 5, 8, 6];
    
    const completeTexts = [
        "Teste completo iniciando!",
        "Pensamentos profundos aqui...",
        "ATENÇÃO TOTAL!",
        "sussurrando suavemente...",
        "A narração continua com detalhes importantes.",
        "CRASH! BOOM! POW!",
        "Diálogo normal retorna.",
        "Conclusão: todos os elementos funcionam perfeitamente."
    ];
    
    for (let i = 0; i < 8; i++) {
        const texts = [
            createBalloon(balloonTypes[i], completeTexts[i], format, {
                x: Math.round(format.width * 0.15),
                y: Math.round(format.height * 0.2),
                w: Math.round(format.width * 0.7),
                h: 100
            })
        ];
        
        // Add extra balloons for stress test
        if (i < 5) {
            texts.push(
                createBalloon('speech', `Balão extra ${i + 1}`, format, {
                    x: Math.round(format.width * 0.1),
                    y: Math.round(format.height * 0.5),
                    w: Math.round(format.width * 0.35),
                    h: 80
                }),
                createBalloon('thought', `Pensamento ${i + 1}`, format, {
                    x: Math.round(format.width * 0.55),
                    y: Math.round(format.height * 0.6),
                    w: Math.round(format.width * 0.35),
                    h: 80
                })
            );
        }
        
        const narrFile = `../../test-audio/narr-pt-0${(i % 5) + 1}.wav`;
        
        pages.push({
            id: genId(),
            layoutId: getLayout(formatId, layouts[i]),
            kenBurns: animations[i],
            duration: durations[i],
            durationLocked: false,
            narration: { 'pt-BR': { file: narrFile, volume: 1.0 } },
            transition: 'fade',
            images: [],
            texts: texts,
            showTextBelow: i === 0 || i === 7,
            narrative: i === 0 ? 'Teste completo de todas as funcionalidades' : (i === 7 ? 'FIM' : '')
        });
    }
    
    return {
        id: genId(),
        metadata: {
            name: `COMPLETE-${formatId.toUpperCase()}`,
            createdAt: Date.now(),
            updatedAt: Date.now()
        },
        videoFormat: formatId,
        backgroundMusic: { 
            file: '../../test-audio/music-drama.wav', 
            volume: 0.4,
            loop: true
        },
        videoAudio: { 
            ducking: { enabled: true, level: 0.2, fadeMs: 600 }
        },
        activeLanguage: 'pt-BR',
        customLayouts: [],
        favoriteLayoutId: null,
        pages: pages
    };
}

// ═══════════════════════════════════════════════════════════════
// MAIN GENERATOR
// ═══════════════════════════════════════════════════════════════

const SCENARIO_GENERATORS = {
    simple: createSimpleProject,
    narrative: createNarrativeProject,
    action: createActionProject,
    dialogue: createDialogueProject,
    epic: createEpicProject,
    minimal: createMinimalProject,
    complete: createCompleteProject
};

function main() {
    const outputDir = path.join(__dirname, '../projects');
    
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    let count = 0;
    const manifest = [];
    
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  HQ MOVIE - VALIDATION SUITE GENERATOR');
    console.log('  4 Formats × 7 Scenarios = 28 Test Projects');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    for (const [formatId, format] of Object.entries(VIDEO_FORMATS)) {
        console.log(`📁 FORMAT: ${format.name} (${format.width}×${format.height})`);
        
        for (const [scenarioId, scenario] of Object.entries(SCENARIOS)) {
            const generator = SCENARIO_GENERATORS[scenarioId];
            const project = generator(formatId, format);
            
            const filename = `${scenarioId}-${formatId}.json`;
            const filepath = path.join(outputDir, filename);
            
            fs.writeFileSync(filepath, JSON.stringify(project, null, 2));
            count++;
            
            manifest.push({
                id: `${scenarioId.toUpperCase()}-${formatId.toUpperCase()}`,
                filename: filename,
                format: formatId,
                scenario: scenarioId,
                pages: project.pages.length,
                expectedDuration: project.pages.reduce((sum, p) => sum + (p.duration || 4), 0),
                hasAudio: !!project.backgroundMusic || project.pages.some(p => !!p.narration),
                balloonCount: project.pages.reduce((sum, p) => sum + (p.texts ? p.texts.length : 0), 0)
            });
            
            const icon = {
                simple: '📄', narrative: '📖', action: '💥',
                dialogue: '💬', epic: '⚔️', minimal: '🎨', complete: '🏆'
            }[scenarioId];
            
            console.log(`  ${icon} ${filename} (${project.pages.length} pages, ${manifest[manifest.length-1].expectedDuration}s)`);
        }
        
        console.log('');
    }
    
    // Save manifest
    const manifestPath = path.join(outputDir, '_manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`  ✅ ${count} projects generated successfully!`);
    console.log(`  📂 Output: ${outputDir}`);
    console.log(`  📋 Manifest: ${manifestPath}`);
    console.log('═══════════════════════════════════════════════════════════════');
}

main();
