/**
 * whatsapp.js
 * Centraliza a lógica de geração de links do WhatsApp para toda a aplicação.
 * Mantém o número de telefone em um único lugar e formata mensagens
 * de forma consistente (pedido geral, pedido de produto específico).
 */

const WHATSAPP_CONFIG = {
  // Número no formato internacional, sem espaços ou símbolos: 55 + DDD + número
  numero: '5585998530792',
};

/**
 * Monta a URL final do wa.me com a mensagem codificada.
 * @param {string} mensagem - Texto da mensagem (sem codificação).
 * @returns {string} URL pronta para uso em href.
 */
function montarLinkWhatsApp(mensagem) {
  const texto = encodeURIComponent(mensagem);
  return `https://wa.me/${WHATSAPP_CONFIG.numero}?text=${texto}`;
}

/**
 * Gera o link de pedido para um produto específico.
 * @param {Object} produto - Objeto do produto (precisa de nome, precoFormatado, codigo).
 * @returns {string} URL do WhatsApp com mensagem pré-formatada.
 */
function linkWhatsAppProduto(produto) {
  const preco = produto.precoFormatado || formatarPreco(produto.preco);
  const mensagem =
    `Olá! 🌸 Tenho interesse no produto:\n\n` +
    `*${produto.nome}* (Cód. ${produto.codigo})\n` +
    `Valor: ${preco}\n\n` +
    `Vocês podem me passar mais detalhes sobre entrega?`;
  return montarLinkWhatsApp(mensagem);
}

/**
 * Gera o link de contato genérico (usado em header, footer, hero, página de contato).
 * @returns {string} URL do WhatsApp com mensagem padrão de saudação.
 */
function linkWhatsAppGeral() {
  const mensagem = 'Olá! Gostaria de saber mais sobre os arranjos e buquês disponíveis.';
  return montarLinkWhatsApp(mensagem);
}

/**
 * Gera o link de pedido consolidado a partir dos itens do carrinho e dados do cliente.
 * @param {Array} itens - Array de { produto, quantidade }.
 * @param {Object} dadosCliente - { nome, telefone, pagamento, observacoes }.
 * @returns {string} URL do WhatsApp com mensagem pré-formatada.
 */
function linkWhatsAppCarrinho(itens, dadosCliente) {
  const { nome, telefone, pagamento, observacoes } = dadosCliente;

  const linhasItens = itens
    .map((item) => {
      const subtotal = item.produto.preco * item.quantidade;
      return `• ${item.quantidade}x ${item.produto.nome} (Cód. ${item.produto.codigo}) — ${formatarPreco(subtotal)}`;
    })
    .join('\n');

  const total = itens.reduce((soma, item) => soma + item.produto.preco * item.quantidade, 0);

  let mensagem =
    `Olá! 🌸 Gostaria de fazer o seguinte pedido:\n\n` +
    `${linhasItens}\n\n` +
    `*Total: ${formatarPreco(total)}*\n\n` +
    `*Dados para entrega:*\n` +
    `Nome: ${nome}\n` +
    `Telefone: ${telefone}\n` +
    `Forma de pagamento: ${pagamento}`;

  if (observacoes) {
    mensagem += `\nObservações: ${observacoes}`;
  }

  return montarLinkWhatsApp(mensagem);
}

/**
 * Formata um número (ponto flutuante) como moeda brasileira simples.
 * Usado como fallback quando o produto não tem precoFormatado.
 * @param {number} valor
 * @returns {string}
 */
function formatarPreco(valor) {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/**
 * Aplica o href correto a todos os elementos com [data-whatsapp="geral"]
 * presentes na página (botões de header, footer, hero, CTA final etc).
 * Deve ser chamado em todas as páginas, no DOMContentLoaded.
 */
function inicializarBotoesWhatsAppGeral() {
  const link = linkWhatsAppGeral();
  document.querySelectorAll('[data-whatsapp="geral"]').forEach((el) => {
    el.setAttribute('href', link);
    el.setAttribute('target', '_blank');
    el.setAttribute('rel', 'noopener noreferrer');
  });
}

document.addEventListener('DOMContentLoaded', inicializarBotoesWhatsAppGeral);
