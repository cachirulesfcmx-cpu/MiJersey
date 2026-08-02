import { escapeHtml, extractVariableNames, renderTemplate } from './template-renderer.util';

describe('escapeHtml', () => {
  it('escapes HTML special characters', () => {
    expect(escapeHtml(`<script>alert("hi") & 'bye'</script>`)).toBe(
      '&lt;script&gt;alert(&quot;hi&quot;) &amp; &#39;bye&#39;&lt;/script&gt;',
    );
  });
});

describe('extractVariableNames', () => {
  it('extracts unique variable names', () => {
    expect(
      extractVariableNames('Hola {{name}}, tu pedido {{orderId}} y {{name}} de nuevo'),
    ).toEqual(['name', 'orderId']);
  });

  it('returns an empty array when there are no variables', () => {
    expect(extractVariableNames('Sin variables aquí')).toEqual([]);
  });
});

describe('renderTemplate', () => {
  it('substitutes known variables and escapes values by default', () => {
    const result = renderTemplate('Hola {{name}}', { name: '<b>Ana</b>' });
    expect(result.output).toBe('Hola &lt;b&gt;Ana&lt;/b&gt;');
    expect(result.missingVariables).toEqual([]);
  });

  it('does not escape when escape is disabled', () => {
    const result = renderTemplate('Hola {{name}}', { name: '<b>Ana</b>' }, { escape: false });
    expect(result.output).toBe('Hola <b>Ana</b>');
  });

  it('reports missing variables and leaves them blank', () => {
    const result = renderTemplate('Hola {{name}}, {{missing}}', { name: 'Ana' });
    expect(result.output).toBe('Hola Ana, ');
    expect(result.missingVariables).toEqual(['missing']);
  });

  it('does not report duplicate missing variables twice', () => {
    const result = renderTemplate('{{missing}} y {{missing}} de nuevo', {});
    expect(result.missingVariables).toEqual(['missing']);
  });
});
