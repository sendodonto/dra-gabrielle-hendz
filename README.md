# Dra. Gabrielle Hendz — landing page

HTML, CSS e JS puros, sem build. O 3D usa three.js 0.170 por importmap (jsDelivr).

```
config.js     ÚNICO arquivo de conteúdo: WhatsApp, Instagram, CRBM, procedimentos,
              textos das regiões do rosto, resultados, galeria e depoimentos
index.html    todas as seções e SEO
styles.css    identidade: quase-preto + tan, tema claro/escuro automático, fonte Satoshi (fonts/)
app.js        menu, header, agendamento, painel das regiões, resultados, lightbox
scenes.js     3D: escultura do hero, rosto estilizado interativo, curvas do Bumbum Master
privacidade.html
img/          fotos PROVISÓRIAS (Pexels) — trocar pelas da Dra.
```

## Antes de publicar de verdade
1. **WhatsApp**: `whatsapp` no `config.js` (55 + DDD + número). Vazio, o agendamento copia a mensagem e abre o Direct do Instagram.
2. **Fotos**: todas provisórias. Troque mantendo os nomes: `hero.webp` (retrato vertical da Dra.), `sobre.webp`, `cursos.webp`, `facial.webp`, `gluteos.webp`, `estetica.webp`, `og.jpg` (1200x630).
3. **Textos das regiões do rosto** (`regioes` no config): hoje são educativos e genéricos. Troque pelos procedimentos que a Dra. confirmar.
4. **Bumbum Master**: o texto e os 3 passos são estrutura; a Dra. precisa descrever o método (comentário TROCAR no index.html).
5. **Resultados**: só fotos reais e autorizadas. Preencha `antesDepois`, `galeria`, `depoimentos` no config; enquanto vazios a seção mostra "em breve".
6. **Cursos e mentorias**: os cards levam ao agendamento; quando houver links de inscrição, troque o botão por um link.
7. **Domínio**: `canonical` e `og` apontam para o GitHub Pages.

## O 3D
- Rosto: geometria **própria** (esfera deformada por funções), sem modelo de terceiros. Girar 360°, zoom (roda/pinça), 5 pontos clicáveis + botões equivalentes (acessível por teclado).
- Cada cena carrega perto da tela e pausa fora dela. Movimento reduzido: sem rotação automática. Sem WebGL: os botões das regiões continuam funcionando. Aparelho fraco: menos polígonos e resolução menor.
