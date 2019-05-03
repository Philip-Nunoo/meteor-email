/* eslint-disable no-plusplus */
/* eslint-disable func-names */
/* eslint-disable import/no-unresolved */
import { Meteor } from 'meteor/meteor';
import MailComposer from 'nodemailer/lib/mail-composer';
import nodemailer from 'nodemailer';
import Future from 'fibers/future';
import urlModule from 'url';

let nextDevModeMailId = 0;
const outputStream = process.stdout;

const makeTransport = function (mailUrlString) {
    const mailUrl = urlModule.parse(mailUrlString, true);
  
    if (mailUrl.protocol !== 'smtp:' && mailUrl.protocol !== 'smtps:') {
      throw new Error(`Email protocol in $MAIL_URL (${ 
                      mailUrlString  }) must be 'smtp' or 'smtps'`);
    }
  
    if (mailUrl.protocol === 'smtp:' && mailUrl.port === '465') {
      Meteor._debug('The $MAIL_URL is \'smtp://...:465\'.  ' +
                    'You probably want \'smtps://\' (The \'s\' enables TLS/SSL) ' +
                    'since \'465\' is typically a secure port.');
    }
  
    // Allow overriding pool setting, but default to true.
    if (!mailUrl.query) {
        mailUrl.query = {};
    }
  
    if (!mailUrl.query.pool) {
        mailUrl.query.pool = 'true';
    }
  
    const transport = nodemailer.createTransport(
        urlModule.format(mailUrl));
  
    transport._syncSendMail = Meteor.wrapAsync(transport.sendMail, transport);
    
    return transport;
};

const getTransport = function(options = { smtp: {}, test: false }) {
    // We delay this check until the first call to Email.send, in case someone
    // set process.env.MAIL_URL in startup code. Then we store in a cache until
    // process.env.MAIL_URL changes.
    
    const url = (options.test && options.smtp.url) ? options.smtp.url : process.env.MAIL_URL;
    if (this.cacheKey === undefined || this.cacheKey !== url) {
        this.cacheKey = url;
        this.cache = url ? makeTransport(url) : null;
    }
    
    return this.cache;
}

const devModeSend = mail => {
    const devModeMailId = nextDevModeMailId++;
  
    const stream = outputStream;
  
    // This approach does not prevent other writers to stdout from interleaving.
    stream.write(`====== BEGIN MAIL #${  devModeMailId  } ======\n`);
    stream.write('(Mail not sent; to enable sending, set the MAIL_URL ' +
                 'environment variable.)\n');
    const readStream = new MailComposer(mail).compile().createReadStream();
    readStream.pipe(stream, {end: false});
    const future = new Future();
    readStream.on('end', () => {
      stream.write(`====== END MAIL #${devModeMailId} ======\n`);
      future.return();
    });
    future.wait();
};

const smtpSend = (transport, mail) => transport._syncSendMail(mail);

class Email {

    /**
     * 
     * @param {*} options 
     * @param {*} settings { transport: { smtp: 'smtpurl', test: false }}
     */
    // eslint-disable-next-line class-methods-use-this
    send(options, settings = {}) {
        const transport = getTransport(settings.transport);
        
        if (transport) {
            return smtpSend(transport, options);
        }
        return devModeSend(options);
    }

    static getSMTPUrl(smtp) {
        return `smtps://${ encodeURIComponent(smtp.username)}:${encodeURIComponent(smtp.password)}@${encodeURIComponent(smtp.server)}:${smtp.port}`;
    }
}

export { Email };
export default 'Email';