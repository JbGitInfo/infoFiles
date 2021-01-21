'use strict'

const fs = require('fs');
const path = require('path');

const LivreApiService = require('../services');
const EmailApiService = require('../services/emailApiService');
const SmsApiService = require('../services/smsApiService');

module.exports = class EmailSmsCommon {
    smsApiService = new SmsApiService();

    /**
    * 
    * @param {{
    * to: [string],
    * subject: string,
    * attachments: [{ tipo: string, filename: string, file: any }],
    * html: string
    * }} obj 
    */
    static async sendEmail(obj) {
        const service = new EmailApiService();
        await service.post({
            from: 'noreply@unidas.com.br',
            to: obj.to,
            html: obj.html,
            subject: obj.subject,
            attachments: obj.attachments
        });
    }
    /**
     * 
     * @param {{
     * Celular: number,
     * smsTexto: string }} obj 
     */
    static async sendSms(obj) {
        const service = new SmsApiService();
        await service.post({
            destination: obj.Celular,
            messagetext: obj.smsTexto
        });
    }
    static async getAttachmentBoleto(numeroBoleto) {
        const service = new LivreApiService();
        let response = await service.getBoletoBase64Format(numeroBoleto);
        if (!(response.data.Boleto)) throw new Error(`Boleto não definido em response.data.Boleto: ${response.data.Boleto}`);

        return [{ tipo: 'BASE_64', filename: 'boleto.pdf', file: response.data.Boleto }]
    }
    /**
     * 
     * @param {{templateName: string, values: [{key: string, value: string}]}} obj
     * @param {string} tipo EMAIL|SMS 
     */
    static buildTemplate(obj, tipo = 'EMAIL') {
        let template = tipo === 'EMAIL'
            ? `templatesEmail/${obj.templateName}.html`
            : `templatesSms/${obj.templateName}.txt`

        let templateStr = fs.readFileSync(path.join(__dirname), `../${template}`);
        obj.values.forEach(element => templateStr = templateStr.replace(element.key, element.value));

        return templateStr;
    }
}