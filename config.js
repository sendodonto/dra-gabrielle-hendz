/* =========================================================================
   CONFIGURACAO DO SITE — o unico arquivo para editar contatos e conteudo.
   ========================================================================= */
window.SITE = {
  // WhatsApp da clinica: so digitos, 55 + DDD + numero. Ex.: '5551999999999'.
  // Vazio: o agendamento copia a mensagem e abre o Direct do Instagram.
  whatsapp: '',
  instagram: 'dra.gabriellehendz',
  crbm: 'CRBM 4876',
  cidade: 'Lajeado - RS',

  // Procedimentos do formulario de agendamento (edite conforme a Dra. confirmar).
  procedimentos: ['Harmonização facial', 'Procedimentos para glúteos', 'Método Bumbum Master', 'Estética facial', 'Cursos e mentorias', 'Ainda não sei, quero uma avaliação'],

  // Regiões do rosto interativo. "texto" é educativo: nada de promessa de resultado.
  // "pos" = posição do ponto no busto de frente (img/busto/00.webp), em % [largura, altura]. Trocou o busto? Ajuste os pontos.
  // Troque "texto" pelos procedimentos que a Dra. realiza em cada região.
  regioes: {
    labios: { nome: 'Lábios', pos: [47, 46], texto: 'Região que pode ser avaliada dentro da harmonização facial, sempre respeitando as proporções naturais do rosto.' },
    queixo: { nome: 'Queixo', pos: [47, 52.5], texto: 'O queixo participa do equilíbrio do perfil. Na avaliação, a Dra. analisa como ele se relaciona com o restante do rosto.' },
    mandibula: { nome: 'Mandíbula', pos: [38.5, 49], texto: 'O contorno da mandíbula define a moldura do rosto. A indicação de qualquer procedimento depende de avaliação individual.' },
    macas: { nome: 'Maçãs do rosto', pos: [61, 37], texto: 'Região ligada à sustentação e ao contorno do terço médio da face. Cada caso é avaliado de forma personalizada.' },
    face: { nome: 'Região facial', pos: [47.5, 20], texto: 'Qualidade da pele e harmonia do rosto como um todo. A estética facial começa por uma avaliação completa.' },
  },

  // Resultados reais e AUTORIZADOS. Enquanto vazio, a seção mostra "em breve".
  // { antes: 'img/resultados/x-antes.webp', depois: 'img/resultados/x-depois.webp', legenda: 'Harmonização facial' }
  antesDepois: [],
  // Fotos da galeria: { src: 'img/resultados/y.webp', legenda: '...' }
  galeria: [],
  // Depoimentos reais: { texto: '...', nome: 'Nome', procedimento: '...' }
  depoimentos: [],
};
