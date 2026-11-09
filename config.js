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

  // Resultados reais e AUTORIZADOS. Enquanto vazio, a seção mostra "em breve".
  // { antes: 'img/resultados/x-antes.webp', depois: 'img/resultados/x-depois.webp', legenda: 'Harmonização facial' }
  antesDepois: [],
  // Fotos da galeria: { src: 'img/resultados/y.webp', legenda: '...' }
  galeria: [],
  // Depoimentos reais: { texto: '...', nome: 'Nome', procedimento: '...' }
  depoimentos: [],
};
