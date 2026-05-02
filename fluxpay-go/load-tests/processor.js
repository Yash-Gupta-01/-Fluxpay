'use strict';

function randomSuffix() {
  return `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
}

module.exports = {
  prepareUsers: function (context, events, done) {
    const suffix = randomSuffix();

    context.vars.receiverEmail = `receiver-${suffix}@fluxpay.local`;
    context.vars.receiverPassword = 'Password123!';
    context.vars.receiverName = `Receiver ${suffix}`;

    context.vars.senderEmail = `sender-${suffix}@fluxpay.local`;
    context.vars.senderPassword = 'Password123!';
    context.vars.senderName = `Sender ${suffix}`;

    context.vars.idempotencyKey = `loadtest-${suffix}`;

    return done();
  }
};
