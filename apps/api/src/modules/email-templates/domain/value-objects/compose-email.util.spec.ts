import { composeEmailHtml } from './compose-email.util';

describe('composeEmailHtml', () => {
  it('renders the template alone when there is no layout', () => {
    const result = composeEmailHtml('<p>Hola {{name}}</p>', { name: 'Ana' }, null);
    expect(result.html).toBe('<p>Hola Ana</p>');
    expect(result.missingVariables).toEqual([]);
  });

  it('inserts the rendered template into the layout content placeholder without escaping it', () => {
    const layout = {
      html: '<html><style>{{css}}</style><body>{{content}}</body></html>',
      css: 'p{color:red}',
    };
    const result = composeEmailHtml('<p>Hola {{name}}</p>', { name: 'Ana' }, layout);
    expect(result.html).toBe(
      '<html><style>p{color:red}</style><body><p>Hola Ana</p></body></html>',
    );
  });

  it('still escapes template variable values even when composed with a layout', () => {
    const layout = { html: '<body>{{content}}</body>', css: null };
    const result = composeEmailHtml('<p>{{name}}</p>', { name: '<b>x</b>' }, layout);
    expect(result.html).toBe('<body><p>&lt;b&gt;x&lt;/b&gt;</p></body>');
  });

  it('reports missing variables from the template, not the layout', () => {
    const layout = { html: '<body>{{content}}</body>', css: null };
    const result = composeEmailHtml('<p>{{missing}}</p>', {}, layout);
    expect(result.missingVariables).toEqual(['missing']);
  });
});
