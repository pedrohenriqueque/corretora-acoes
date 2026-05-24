/**
 * @openapi
 * components:
 *   schemas:
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *
 *     Message:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *
 *     RegisterRequest:
 *       type: object
 *       required: [nome, email, senha, senhaRepetida]
 *       properties:
 *         nome:
 *           type: string
 *           example: João Silva
 *         email:
 *           type: string
 *           format: email
 *           example: joao@email.com
 *         senha:
 *           type: string
 *           format: password
 *           description: Mínimo 8 caracteres, letras e números
 *           example: senha123
 *         senhaRepetida:
 *           type: string
 *           format: password
 *           example: senha123
 *
 *     RegisterResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         acoesIniciais:
 *           type: array
 *           items:
 *             type: string
 *
 *     LoginRequest:
 *       type: object
 *       required: [email, senha]
 *       properties:
 *         email:
 *           type: string
 *         senha:
 *           type: string
 *           format: password
 *
 *     LoginResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         token:
 *           type: string
 *         usuario:
 *           type: object
 *           properties:
 *             id_usuario:
 *               type: integer
 *             nome:
 *               type: string
 *             email:
 *               type: string
 *
 *     RecuperarSenhaRequest:
 *       type: object
 *       required: [email]
 *       properties:
 *         email:
 *           type: string
 *         codigo:
 *           type: string
 *           description: Código numérico de 6 dígitos enviado por e-mail (etapa 2)
 *         novaSenha:
 *           type: string
 *           description: Nova senha com letras e números, mínimo 8 caracteres (etapa 2)
 *         senhaRepetida:
 *           type: string
 *           description: Confirmação da nova senha (etapa 2)
 *
 *     TrocarSenhaRequest:
 *       type: object
 *       required: [senhaAtual, novaSenha, novaSenhaRepetida]
 *       properties:
 *         senhaAtual:
 *           type: string
 *         novaSenha:
 *           type: string
 *         novaSenhaRepetida:
 *           type: string
 *
 *     CodigoAcaoRequest:
 *       type: object
 *       required: [codigo]
 *       properties:
 *         codigo:
 *           type: string
 *           example: PETR4
 *
 *     AcaoMercado:
 *       type: object
 *       properties:
 *         codigo:
 *           type: string
 *         preco:
 *           type: number
 *           format: float
 *         variacao_nominal:
 *           type: number
 *           format: float
 *         variacao_percentual:
 *           type: number
 *           format: float
 *
 *     ListaAcoesInteresseResponse:
 *       type: object
 *       properties:
 *         horaNegociacao:
 *           type: string
 *           example: '14:00'
 *         acoes:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AcaoMercado'
 *
 *     AvancaTempoRequest:
 *       type: object
 *       properties:
 *         incrementoMinutos:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *
 *     AvancaTempoResponse:
 *       type: object
 *       properties:
 *         novaHoraNegociacao:
 *           type: string
 *         acoes:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AcaoMercado'
 *
 *     AcaoDisponivel:
 *       type: object
 *       properties:
 *         codigo:
 *           type: string
 *         fechamento:
 *           type: number
 *
 *     ExibirAcaoResponse:
 *       type: object
 *       properties:
 *         codigo:
 *           type: string
 *         preco_atual:
 *           type: number
 *
 *     ComprarAcaoRequest:
 *       type: object
 *       required: [codigo, quantidade, tipoOrdem]
 *       properties:
 *         codigo:
 *           type: string
 *           example: PETR4
 *         quantidade:
 *           type: integer
 *           minimum: 1
 *         tipoOrdem:
 *           type: string
 *           enum: [MERCADO, PROGRAMADA]
 *         precoOrdem:
 *           type: number
 *           description: Obrigatório para PROGRAMADA. Se >= preço atual, executa na hora.
 *
 *     VenderAcaoRequest:
 *       type: object
 *       required: [codigo, quantidade, tipoOrdem]
 *       properties:
 *         codigo:
 *           type: string
 *           example: PETR4
 *         quantidade:
 *           type: integer
 *           minimum: 1
 *         tipoOrdem:
 *           type: string
 *           enum: [MERCADO, PROGRAMADA]
 *         precoOrdem:
 *           type: number
 *           description: Obrigatório para PROGRAMADA. Se <= preço atual, executa na hora.
 *
 *     OrdemExecutada:
 *       type: object
 *       properties:
 *         id_ordem:
 *           type: integer
 *         id_usuario:
 *           type: integer
 *         cod_acao:
 *           type: string
 *         preco_execucao:
 *           type: number
 *         valor_total:
 *           type: number
 *         quantidade:
 *           type: integer
 *         tipo_ordem:
 *           type: string
 *         status:
 *           type: string
 *           enum: [EXECUTADA]
 *
 *     OrdemPendente:
 *       type: object
 *       properties:
 *         id_ordem:
 *           type: integer
 *         id_usuario:
 *           type: integer
 *         cod_acao:
 *           type: string
 *         preco_ordem:
 *           type: number
 *         quantidade:
 *           type: integer
 *         tipo_ordem:
 *           type: string
 *         status:
 *           type: string
 *           enum: [PENDENTE]
 *
 *     PosicaoCarteira:
 *       allOf:
 *         - $ref: '#/components/schemas/AcaoMercado'
 *         - type: object
 *           properties:
 *             quantidade:
 *               type: integer
 *             preco_medio:
 *               type: number
 *             ganho_perda:
 *               type: number
 *               description: quantidade × (preco_atual − preco_medio)
 *
 *     CarteiraResponse:
 *       type: object
 *       properties:
 *         horaNegociacao:
 *           type: string
 *         ganhos_perdas_total:
 *           type: number
 *         acoes:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PosicaoCarteira'
 */

module.exports = {};
