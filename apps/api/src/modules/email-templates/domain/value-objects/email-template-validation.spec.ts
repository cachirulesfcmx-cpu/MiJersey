import { validateEmailTemplateForPublish } from './email-template-validation';

function build(overrides: Partial<{ subject: string; html: string; text: string }> = {}) {
  return {
    subject: overrides.subject ?? 'Tu pedido {{orderId}}',
    html: overrides.html ?? '<p>Hola {{name}}</p>',
    text: overrides.text ?? 'Hola {{name}}',
  };
}

describe('validateEmailTemplateForPublish', () => {
  it('accepts a well-formed template', () => {
    expect(validateEmailTemplateForPublish(build())).toBeNull();
  });

  it('rejects an empty subject', () => {
    expect(validateEmailTemplateForPublish(build({ subject: '   ' }))).toBe(
      'subject no puede estar vacío para publicar',
    );
  });

  it('rejects an empty html', () => {
    expect(validateEmailTemplateForPublish(build({ html: '' }))).toBe(
      'html no puede estar vacío para publicar',
    );
  });

  it('rejects unbalanced variable braces in html', () => {
    expect(validateEmailTemplateForPublish(build({ html: '<p>Hola {{name}</p>' }))).toBe(
      'html tiene llaves de variable sin cerrar',
    );
  });

  it('rejects unbalanced variable braces in subject', () => {
    expect(validateEmailTemplateForPublish(build({ subject: 'Hola {{name' }))).toBe(
      'subject tiene llaves de variable sin cerrar',
    );
  });

  it('rejects unbalanced variable braces in text', () => {
    expect(validateEmailTemplateForPublish(build({ text: 'Hola name}}' }))).toBe(
      'text tiene llaves de variable sin cerrar',
    );
  });
});
