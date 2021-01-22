'use strict'

const emailSmsCommon = require('../../utils/emailSmsCommon');
const base = require('./baseJob');
const ContextRepository = require('../../repositories/contextRepository');

module.exports = class disparoEmailSmsJob extends base {

    //instanciando in private
    #contextRepository = new ContextRepository();

    constructor(nomeJob) {
        super(nomeJob)
    }
    //start da Job deve ser chamado no index.js (disparo)
    // Ao criar um novo disparo deve-se apenas criar um novo método start para iniciar o disparo desejado
    async startContext() {
        //Buscar fila no repository do contexto
        const results = await this.#contextRepository.findFile();

        //buscar templates criados para o disparo tanto de email quanto sms
        function getTemplate(obj) {
            return { email: 'contextEmailTemplate', sms: 'contextSmsTemplate' }
        }
        //loop na fila para disparar e-mails/sms
        for (const itemFila of results) {
            let attachments = [];
            if (itemFila.NumeroBoleto !== null) attachments = await emailSmsCommon.getAttachmentBoleto(itemFila.NumeroBoleto)
            const templateObj = getTemplate(itemFila);
            await this._sendEmail(
				{
					to: [itemFila.Email],
					subject: 'Título e-mail',
					attachments: attachments,
					html: emailSmsCommon.buildTemplate({
						templateName: templateObj.email,
						values: [
							//mapear keys a ser convertidas no corpo do e-mail/sms
							{ key: '%keyExemplo%', value: itemFila.Exemplo }
						]
                },
				'SMS'
			)
            });
			await this.#contextRepository.Updatefila(itemFila);
			
            const smsText = emailSmsCommon.buildTemplate({
                templateName: templateObj.sms,
                values: [
                    //mapear keys a ser convertidas no corpo do e-mail/sms
                    { key: '%keyExemplo%', value: itemFila.Exemplo }
                ]
            })
            await emailSmsCommon.sendSms(itemFila.Celular, smsText)
        }
    }
}