import type { BlogAuthor } from '@mijersey/sdk';

/** Author Profile (spec 027 §6) — MiJersey no tiene todavía un perfil público de autor con bio/avatar (User, 003, no tiene esos campos); se muestra el nombre real del autor junto al artículo, el dato mínimo disponible sin ampliar el modelo de Identity fuera del alcance de este sprint. */
export function AuthorCard({ author }: { author: BlogAuthor }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-neutral-200 p-4">
      <div className="bg-brand-100 text-brand-700 flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold">
        {author.firstName[0]}
        {author.lastName[0]}
      </div>
      <div>
        <p className="text-sm font-medium text-neutral-900">
          {author.firstName} {author.lastName}
        </p>
        <p className="text-xs text-neutral-500">Autor</p>
      </div>
    </div>
  );
}
