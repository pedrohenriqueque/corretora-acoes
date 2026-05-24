/**
 * @openapi
 * tags:
 *   - name: Ordem
 *     description: Ordens de compra
 *
 * /ordem/comprar-acao:
 *   post:
 *     tags: [Ordem]
 *     summary: Solicita compra de ação
 *     description: |
 *       **MERCADO** — executa na hora ao preço do minuto atual.
 *       **PROGRAMADA** — grava PENDENTE; executa em AvancaTempo se preço ≤ alvo.
 *       Se preço alvo ≥ preço atual, executa imediatamente.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ComprarAcaoRequest'
 *     responses:
 *       201:
 *         description: Ordem criada ou executada
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/OrdemExecutada'
 *                 - $ref: '#/components/schemas/OrdemPendente'
 *       400:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /ordem/vender-acao:
 *   post:
 *     tags: [Ordem]
 *     summary: Solicita venda de ação
 *     description: |
 *       **MERCADO** — executa na hora ao preço do minuto atual e credita na conta corrente.
 *       **PROGRAMADA** — grava PENDENTE; executa em AvancaTempo se preço ≥ alvo.
 *       Se preço alvo ≤ preço atual, executa imediatamente.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VenderAcaoRequest'
 *     responses:
 *       201:
 *         description: Ordem criada ou executada
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/OrdemExecutada'
 *                 - $ref: '#/components/schemas/OrdemPendente'
 *       400:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

module.exports = {};
