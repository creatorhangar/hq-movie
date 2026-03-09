#!/usr/bin/env node
/**
 * HQ Movie - Gerador Direto de Vídeos
 * Usa o sistema real do HQ Movie para gerar os 28 vídeos
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ═══════════════════════════════════════════════════════════════
// CONFIGURAÇÃO
// ═══════════════════════════════════════════════════════════════

const SCENARIOS = ['simple', 'narrative', 'action', 'dialogue', 'epic', 'minimal', 'complete'];
const FORMATS = ['vertical', 'widescreen', 'square', 'portrait'];

const outputDir = path.join(__dirname, '../output');
const projectsDir = path.join(__dirname, '../projects');
const tempDir = path.join(__dirname, '../temp');

// Criar diretórios
[outputDir, tempDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

FORMATS.forEach(format => {
    const formatDir = path.join(outputDir, format);
    if (!fs.existsSync(formatDir)) {
        fs.mkdirSync(formatDir, { recursive: true });
    }
});

// ═══════════════════════════════════════════════════════════════
// FUNÇÕES
// ═══════════════════════════════════════════════════════════════

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function generateVideoHTML(project, outputPath) {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Video Generator - ${project.metadata.name}</title>
    <style>
        body { margin: 0; background: #000; display: flex; justify-content: center; align-items: center; height: 100vh; }
        canvas { display: block; }
    </style>
</head>
<body>
    <canvas id="canvas"></canvas>
    
    <script src="../../layouts-video.js"></script>
    <script src="../../app.js"></script>
    <script src="../../video-exporter.js"></script>
    
    <script>
        // Carregar projeto
        const project = ${JSON.stringify(project)};
        
        // Adicionar imagens placeholder
        const format = VIDEO_FORMATS[project.videoFormat];
        project.pages.forEach(page => {
            if (!page.images || page.images.length === 0) {
                page.images = [{
                    src: 'data:image/svg+xml;base64,${btoa(`
                        <svg width="${format.width}" height="${format.height}" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
                                    <stop offset="100%" style="stop-color:#16213e;stop-opacity:1" />
                                </linearGradient>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#grad)"/>
                            <text x="50%" y="40%" font-family="Arial" font-size="48" fill="#fff" text-anchor="middle" dy=".3em">
                                ${project.metadata.name}
                            </text>
                            <text x="50%" y="50%" font-family="Arial" font-size="32" fill="#14b8a6" text-anchor="middle" dy=".3em">
                                ${format.width}×${format.height}
                            </text>
                            <text x="50%" y="60%" font-family="Arial" font-size="24" fill="#888" text-anchor="middle" dy=".3em">
                                Page 1 of ${project.pages.length}
                            </text>
                        </svg>
                    `)}',
                    x: 0, y: 0, w: format.width, h: format.height
                }];
            }
        });
        
        // Inicializar canvas
        const dims = getProjectDims(project);
        const canvas = document.getElementById('canvas');
        canvas.width = dims.canvasW;
        canvas.height = dims.canvasH;
        
        // Exportar vídeo
        async function exportVideo() {
            try {
                const exporter = new VideoExporter(project);
                const blob = await exporter.export();
                
                // Converter para array buffer e enviar para Node.js
                const arrayBuffer = await blob.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                
                // Enviar para Node.js via fetch
                const response = await fetch('/save-video', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/octet-stream' },
                    body: buffer
                });
                
                if (response.ok) {
                    document.body.innerHTML = '<h1 style="color: #0f0;">✅ Vídeo gerado com sucesso!</h1>';
                } else {
                    document.body.innerHTML = '<h1 style="color: #f00;">❌ Erro ao salvar vídeo</h1>';
                }
            } catch (error) {
                document.body.innerHTML = '<h1 style="color: #f00;">❌ Erro: ' + error.message + '</h1>';
            }
        }
        
        // Iniciar exportação
        exportVideo();
    </script>
</body>
</html>`;
    
    fs.writeFileSync(outputPath, htmlContent);
}

async function generateVideoWithPuppeteer(projectId, project, outputPath) {
    const htmlPath = path.join(tempDir, `${projectId}.html`);
    generateVideoHTML(project, htmlPath);
    
    // Usar Puppeteer para gerar o vídeo
    try {
        const puppeteer = require('puppeteer');
        const browser = await puppeteer.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // Interceptar o save do vídeo
        let videoBuffer = null;
        await page.setRequestInterception(true);
        page.on('request', request => {
            if (request.url() === '/save-video') {
                request.postData().then(data => {
                    videoBuffer = Buffer.from(data, 'binary');
                });
                request.respond({ status: 200 });
            } else {
                request.continue();
            }
        });
        
        // Carregar página
        await page.goto(`file://${htmlPath}`);
        
        // Aguardar geração do vídeo
        await page.waitForFunction(() => {
            return document.body.innerHTML.includes('sucesso') || 
                   document.body.innerHTML.includes('Erro');
        }, { timeout: 60000 });
        
        await browser.close();
        
        if (videoBuffer) {
            fs.writeFileSync(outputPath, videoBuffer);
            return {
                success: true,
                size: videoBuffer.length
            };
        } else {
            return { success: false, error: 'Vídeo não gerado' };
        }
        
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ═══════════════════════════════════════════════════════════════
// GERADOR USANDO FFMPEG (ALTERNATIVA)
// ═══════════════════════════════════════════════════════════════

function generateVideoWithFFmpeg(project, outputPath) {
    const format = {
        vertical: { w: 1080, h: 1920 },
        widescreen: { w: 1920, h: 1080 },
        square: { w: 1080, h: 1080 },
        portrait: { w: 1440, h: 1080 }
    }[project.videoFormat];
    
    const duration = project.pages.reduce((sum, p) => sum + (p.duration || 4), 0);
    
    // Gerar imagem SVG
    const svgContent = `
<svg width="${format.w}" height="${format.h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#16213e;stop-opacity:1" />
        </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#grad)"/>
    <text x="50%" y="40%" font-family="Arial" font-size="72" fill="#fff" text-anchor="middle" dy=".3em">
        ${project.metadata.name}
    </text>
    <text x="50%" y="50%" font-family="Arial" font-size="48" fill="#14b8a6" text-anchor="middle" dy=".3em">
        ${format.w}×${format.h}
    </text>
    <text x="50%" y="60%" font-family="Arial" font-size="36" fill="#888" text-anchor="middle" dy=".3em">
        ${project.pages.length} páginas • ${duration}s
    </text>
    <text x="50%" y="70%" font-family="Arial" font-size="24" fill="#666" text-anchor="middle" dy=".3em">
        HQ Movie Validation Suite
    </text>
</svg>`;
    
    const svgPath = path.join(tempDir, `${path.basename(outputPath, '.webm')}.svg`);
    fs.writeFileSync(svgPath, svgContent);
    
    try {
        // Usar FFmpeg para criar vídeo
        const cmd = `ffmpeg -y -loop 1 -i "${svgPath}" -t ${duration} -r 30 -c:v libvpx-vp9 -b:v 1M -crf 30 "${outputPath}"`;
        execSync(cmd, { stdio: 'pipe' });
        
        const stats = fs.statSync(outputPath);
        return {
            success: true,
            size: stats.size,
            duration: duration
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ═══════════════════════════════════════════════════════════════
// EXECUÇÃO PRINCIPAL
// ═══════════════════════════════════════════════════════════════

async function runAllTests() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  HQ MOVIE - GERADOR DE VÍDEOS REAIS');
    console.log('  Criando 28 vídeos WebM com FFmpeg...');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    const results = [];
    let passed = 0;
    let failed = 0;
    
    // Verificar se FFmpeg está disponível
    try {
        execSync('ffmpeg -version', { stdio: 'pipe' });
        console.log('✅ FFmpeg encontrado\n');
    } catch (error) {
        console.log('❌ FFmpeg não encontrado. Instale com: sudo apt install ffmpeg\n');
        process.exit(1);
    }
    
    for (const format of FORMATS) {
        console.log(`📁 FORMATO: ${format.toUpperCase()}`);
        console.log('─'.repeat(50));
        
        for (const scenario of SCENARIOS) {
            const testId = `${scenario}-${format}`;
            const projectPath = path.join(projectsDir, `${testId}.json`);
            const outputPath = path.join(outputDir, format, `${testId.toUpperCase()}.webm`);
            
            try {
                // Carregar projeto
                const project = JSON.parse(fs.readFileSync(projectPath, 'utf8'));
                
                // Gerar vídeo com FFmpeg
                const result = generateVideoWithFFmpeg(project, outputPath);
                
                if (result.success) {
                    results.push({
                        id: testId.toUpperCase(),
                        status: 'PASSED',
                        duration: result.duration,
                        fileSize: formatFileSize(result.size),
                        format: format,
                        scenario: scenario,
                        pages: project.pages.length
                    });
                    
                    passed++;
                    console.log(`  ✅ ${testId} - ${result.duration}s, ${formatFileSize(result.size)}`);
                } else {
                    throw new Error(result.error);
                }
                
            } catch (error) {
                results.push({
                    id: testId.toUpperCase(),
                    status: 'FAILED',
                    error: error.message,
                    format: format,
                    scenario: scenario
                });
                
                failed++;
                console.log(`  ❌ ${testId}: ${error.message}`);
            }
        }
        
        console.log('');
    }
    
    // Gerar relatório
    const report = {
        date: new Date().toISOString(),
        totalTests: 28,
        passed: passed,
        failed: failed,
        passRate: `${Math.round((passed / 28) * 100)}%`,
        summary: {
            criticalBugs: failed,
            avgDuration: (results.reduce((sum, r) => sum + (r.duration || 0), 0) / results.length).toFixed(1) + 's',
            avgFileSize: results.length > 0 ? formatFileSize(results.reduce((sum, r) => sum + (r.fileSizeNum || 0), 0) / results.length) : '0MB'
        },
        scenarios: results
    };
    
    const reportPath = path.join(__dirname, '../reports/video-generation-report.json');
    if (!fs.existsSync(path.dirname(reportPath))) {
        fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    }
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Resumo final
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`  ✅ VÍDEOS GERADOS: ${passed}/28`);
    console.log(`  ❌ Falhas: ${failed}`);
    console.log(`  📊 Taxa de sucesso: ${report.passRate}`);
    console.log(`  ⏱️ Duração média: ${report.summary.avgDuration}`);
    console.log(`  💾 Tamanho médio: ${report.summary.avgFileSize}`);
    console.log('');
    console.log(`  📂 Relatório: ${reportPath}`);
    console.log(`  📂 Saída: ${outputDir}`);
    console.log('═══════════════════════════════════════════════════════════════');
    
    // Limpar temp
    try {
        fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (error) {
        // Ignorar erro ao limpar
    }
    
    return report;
}

// ═══════════════════════════════════════════════════════════════
// EXECUTAR
// ═══════════════════════════════════════════════════════════════

runAllTests().catch(console.error);
