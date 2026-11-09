# Dra. Gabrielle Hendz — landing page

HTML, CSS e JS puros, sem build e sem dependências.

```
config.js     ÚNICO arquivo de conteúdo: WhatsApp, Instagram, CRBM, procedimentos,
              resultados, galeria e depoimentos
index.html    todas as seções e SEO
styles.css    identidade: clínico claro, azul-gelo + azul-marinho + acento azul, fonte Satoshi (fonts/)
app.js        menu, header, agendamento, resultados, lightbox
privacidade.html
img/          fotos PROVISÓRIAS (Pexels) — trocar pelas da Dra.
```

## Antes de publicar de verdade
1. **WhatsApp**: `whatsapp` no `config.js` (55 + DDD + número). Vazio, o agendamento copia a mensagem e abre o Direct do Instagram.
2. **Fotos**: todas provisórias. Troque mantendo os nomes: `hero.webp` (retrato vertical da Dra.), `sobre.webp`, `cursos.webp`, `gluteos.webp`, `estetica.webp`, `og.jpg` (1200x630).
3. **Regiões da Harmonização Facial**: as etiquetas do card (Lábios, Queixo...) ficam no index.html (comentário TROCAR). Ajuste quando a Dra. confirmar.
4. **Bumbum Master**: o texto e os 3 passos são estrutura; a Dra. precisa descrever o método (comentário TROCAR no index.html).
5. **Resultados**: só fotos reais e autorizadas. Preencha `antesDepois`, `galeria`, `depoimentos` no config; enquanto vazios a seção mostra "em breve".
6. **Cursos e mentorias**: os cards levam ao agendamento; quando houver links de inscrição, troque o botão por um link.
7. **Domínio**: `canonical` e `og` apontam para o GitHub Pages.

