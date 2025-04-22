declare module 'sib-api-v3-sdk' {
  export namespace ApiClient {
    export const instance: {
      authentications: {
        'api-key': {
          apiKey: string;
        };
      };
    };
  }

  export class SendSmtpEmail {
    sender: {
      name: string;
      email: string;
    };
    to: Array<{
      email: string;
      name?: string;
    }>;
    subject: string;
    htmlContent: string;
    textContent: string;
  }

  export class TransactionalEmailsApi {
    sendTransacEmail(sendSmtpEmail: SendSmtpEmail): Promise<any>;
  }
}