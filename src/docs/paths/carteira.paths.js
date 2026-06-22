/**
 * @openapi
 * tags:
 *   - name: Carteira
 *     description: Posições do investidor e ganhos/perdas
 *
 * /carteira:
 *   get:
 *     tags: [Carteira]
 *     summary: Lista posições com preços e ganhos/perdas
 *     description: |
 *       Usa o mesmo relógio e preços do mercado (`horaNegociacao` + minuto atual).
 *       `ganho_perda` = quantidade × (preco_atual − preco_medio).
 *       `lucro_realizado_total` é a soma do lucro das vendas já executadas.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CarteiraResponse'
 *       401:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

module.exports = {};
