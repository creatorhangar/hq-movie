# HQ Movie - How to Deploy

O HQ Movie é uma aplicação estática (Vanilla JS/HTML/CSS). Não existe backend em Node.js ou banco de dados relacional para configurar. O banco de dados é o navegador do usuário (IndexedDB) e todos os arquivos são servidos estaticamente.

## Requisito Crítico: Headers COOP/COEP

A única "pegadinha" no deploy deste projeto é que a **Exportação de Vídeo** utiliza a Web Audio API avançada (e potencialmente `SharedArrayBuffer` para conversões/FFmpeg dependendo da versão). Para que isso funcione com segurança máxima no Chrome/Safari moderno sem quebrar silenciosamente, o servidor estático **deve** enviar os seguintes headers HTTP:

```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

## Como rodar localmente (Desenvolvimento / "Abandonado")

Use o script Python embutido no projeto. Ele já configura os headers corretamente.

```bash
# Necessário apenas Python 3 instalado
python3 serve-nocache.py
```
Acesse: `http://localhost:8082`

## Deploy em Produção (Netlify / Vercel / S3 / Apache / Nginx)

Basta copiar todos os arquivos da pasta raiz para o servidor web.
**Não é necessário rodar `npm run build`** (a pasta node_modules serve apenas para ferramentas de teste locais).

### Exemplo: Configuração Nginx (produção)

Adicione as seguintes linhas no bloco `server` ou `location /` do seu `nginx.conf`:

```nginx
location / {
    root /var/www/hq-movie;
    index index.html;
    
    # Obrigatório para a Exportação de Vídeo funcionar!
    add_header Cross-Origin-Opener-Policy same-origin;
    add_header Cross-Origin-Embedder-Policy require-corp;
}
```

### Exemplo: Configuração Netlify (produção)

Crie um arquivo `_headers` na raiz do projeto contendo:

```text
/*
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
```

---

*Filosofia Launch & Leave: Se os serviços modernos falharem, contanto que você tenha acesso aos arquivos fonte e consiga levantar um servidor HTTP básico com esses headers, o HQ Movie continuará operando e exportando vídeos 100% offline para a eternidade.*
