#!/usr/bin/env node
/**
 * Gerador de Projetos de Teste - HQ Movie
 * Gera 28 projetos JSON (4 formatos × 7 animações)
 */

const fs = require('fs');
const path = require('path');

const VIDEO_FORMATS = {
    vertical: { id: 'vertical', name: 'Vertical 9:16', width: 1080, height: 1920 },
    widescreen: { id: 'widescreen', name: 'Widescreen 16:9', width: 1920, height: 1080 },
    square: { id: 'square', name: 'Square 1:1', width: 1080, height: 1080 },
    portrait: { id: 'portrait', name: 'Portrait 4:3', width: 1440, height: 1080 }
};

const KEN_BURNS_MODES = [
    { id: 'static', name: 'Estático', icon: '⏹' },
    { id: 'zoomIn', name: 'Zoom In', icon: '🔍' },
    { id: 'zoomOut', name: 'Zoom Out', icon: '🔎' },
    { id: 'panLeft', name: 'Pan Esquerda', icon: '⬅' },
    { id: 'panRight', name: 'Pan Direita', icon: '➡' },
    { id: 'panUp', name: 'Pan Cima', icon: '⬆' },
    { id: 'float', name: 'Flutuação', icon: '🌊' }
];

const TEXT_SAMPLES = {
    short: 'Olá!',
    medium: 'Esta é uma frase de tamanho médio para testar o sistema de balões.',
    long: 'Esta é uma frase muito mais longa que vai testar como o sistema lida com texto extenso dentro dos balões de fala, pensamento e narração. O objetivo é verificar se há quebra de linha adequada.',
    veryLong: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore.'
};

const BALLOON_TYPES = ['speech', 'thought', 'shout', 'whisper', 'narration', 'sfx'];

function genId() {
    return 'id_' + Math.random().toString(36).substr(2, 9);
}

function getDefaultLayout(formatId) {
    const layouts = {
        vertical: 'v1-splash',
        widescreen: 'w1-cinematic',
        square: 's1-full',
        portrait: 'p1-full'
    };
    return layouts[formatId] || 'v1-splash';
}

function createTestProject(formatId, format, animation) {
    const projectId = genId();
    const timestamp = Date.now();
    
    return {
        id: projectId,
        metadata: {
            name: `Test ${format.name} - ${animation.name}`,
            createdAt: timestamp,
            updatedAt: timestamp
        },
        videoFormat: formatId,
        videoAudio: {
            backgroundMusic: null,
            backgroundMusicVolume: 0.3
        },
        customLayouts: [],
        favoriteLayoutId: null,
        pages: [
            {
                id: genId(),
                layoutId: getDefaultLayout(formatId),
                kenBurns: animation.id,
                duration: 4,
                durationLocked: false,
                audioNarration: null,
                transition: 'fade',
                images: [],
                texts: [
                    {
                        id: genId(),
                        type: 'speech',
                        text: TEXT_SAMPLES.short,
                        x: Math.round(format.width * 0.1),
                        y: Math.round(format.height * 0.1),
                        w: Math.round(format.width * 0.25),
                        h: 100,
                        direction: 's',
                        font: 'comic',
                        fontSize: 16,
                        color: '#000000'
                    },
                    {
                        id: genId(),
                        type: 'thought',
                        text: TEXT_SAMPLES.medium,
                        x: Math.round(format.width * 0.5),
                        y: Math.round(format.height * 0.3),
                        w: Math.round(format.width * 0.3),
                        h: 120,
                        direction: 'se',
                        font: 'marker',
                        fontSize: 14,
                        color: '#000000'
                    },
                    {
                        id: genId(),
                        type: 'narration',
                        text: TEXT_SAMPLES.long,
                        x: Math.round(format.width * 0.1),
                        y: Math.round(format.height * 0.6),
                        w: Math.round(format.width * 0.8),
                        h: 150,
                        direction: 'center',
                        font: 'serif',
                        fontSize: 14,
                        color: '#000000',
                        snapPosition: 'bottom'
                    }
                ],
                showTextBelow: false,
                narrative: ''
            }
        ]
    };
}

function main() {
    const outputDir = path.join(__dirname, '../projects');
    
    // Criar diretório se não existir
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    let count = 0;
    
    console.log('🎬 Gerando projetos de teste...\n');
    
    for (const [formatId, format] of Object.entries(VIDEO_FORMATS)) {
        console.log(`📁 Formato: ${format.name}`);
        
        for (const animation of KEN_BURNS_MODES) {
            const project = createTestProject(formatId, format, animation);
            const filename = `${formatId}-${animation.id}.json`;
            const filepath = path.join(outputDir, filename);
            
            fs.writeFileSync(filepath, JSON.stringify(project, null, 2));
            count++;
            
            console.log(`  ${animation.icon} ${filename}`);
        }
        
        console.log('');
    }
    
    console.log(`✅ ${count} projetos gerados com sucesso!`);
    console.log(`📂 Pasta: ${outputDir}`);
}

main();
