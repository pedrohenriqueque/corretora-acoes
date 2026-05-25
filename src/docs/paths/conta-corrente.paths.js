/**
 * @openapi
 * tags:
 *   - name: ContaCorrente
 *     description: Extrato e lançamentos financeiros
 *
 * /conta-corrente:
 *   get:
 *     tags: [ContaCorrente]
 *     summary: Retorna extrato da conta corrente
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ContaCorrenteLancamento'
 *       401:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /conta-corrente/deposito:
 *   post:
 *     tags: [ContaCorrente]
 *     summary: Registra um depósito manual
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ContaCorrenteDepositoRequest'
 *     responses:
 *       201:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ContaCorrenteLancamento'
 *       400:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /conta-corrente/retirada:
 *   post:
 *     tags: [ContaCorrente]
 *     summary: Registra uma retirada manual
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ContaCorrenteRetiradaRequest'
 *     responses:
 *       201:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ContaCorrenteLancamento'
 *       400:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

module.exports = {};
