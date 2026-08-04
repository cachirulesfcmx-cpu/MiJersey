#!/usr/bin/env node
/**
 * Organiza el catalogo real de productos en las categorias reales existentes (ligas, selecciones,
 * Mundial 2026, Temporada 26/27, Retro/Otros) usando SOLO el nombre/descripcion real de cada
 * producto -- nunca inventa un equipo o liga que el producto no menciona.
 *
 * Contexto (ver tools/populate-explore-banners.mjs y tools/create-explore-categories.mjs): el
 * usuario reviso bartjerseys.com y confirmo el patron real de esas 2 colecciones:
 *   - "Camisas Mundial" = jerseys de SELECCIONES NACIONALES con "Mundial" en el nombre (de
 *     cualquier año -- 1998, 2002, 2010, 2014, 2022, 2026 -- Bartjerseys los agrupa todos ahi).
 *     NO incluye "Mundial de Clubes" (eso es de un club, no de una seleccion).
 *   - "Temporada 26/27" = jerseys de CLUB con "26/27" en el nombre (liga a la que pertenezca el
 *     club, sin importar si es local/visita).
 * "Custom Shirts" y "Tee Shirts" en Bartjerseys son diseños especiales/mashup (ej. colaboraciones
 * con un artista) y playeras streetwear de tributo a jugador -- NO existe forma confiable de
 * detectar eso por texto sin arriesgar falsos positivos, asi que este script NO asigna nada a esas
 * 2 categorias: en vez de eso, imprime la lista de productos que no matchean ningun equipo/pais
 * conocido al final (candidatos-revisar), para que se revisen y asignen manualmente en /admin --
 * igual que se acordo originalmente para esas 4 categorias nuevas.
 *
 * Reglas:
 *   - Solo AGREGA categorias (never quita una que ya tenga el producto).
 *   - Idempotente: si el producto ya tiene la categoria, no hace nada.
 *   - "Retro/Otros" se asigna a: (a) cualquier producto cuya descripcion ofrezca una version
 *     "Retro" real (dato ya presente en el catalogo legacy, no inventado), o (b) equipos/clubes
 *     reconocidos que no tienen liga propia en el arbol de categorias (ej. clubes de Brasil,
 *     Argentina o MLS) -- ahi funciona como el cajon "Otros".
 *
 * Uso:
 *   node tools/organize-product-categories.mjs --dry-run
 *   node tools/organize-product-categories.mjs
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const args = parseArgs(process.argv.slice(2));
const dryRun = Boolean(args['dry-run']);

const PrismaClient = loadPrismaClient();
const prisma = new PrismaClient();

// --- Diccionarios (conocimiento futbolistico publico, no inventado) ------------------------

// Selecciones nacionales -- si el nombre del producto menciona uno de estos paises, es un
// jersey de seleccion. Sin acentos porque asi vienen los nombres reales en el catalogo.
const COUNTRY_TEAMS = [
  'Mexico', 'Argentina', 'Brasil', 'Brazil', 'Francia', 'France', 'Espana', 'Spain', 'Alemania',
  'Germany', 'Portugal', 'Italia', 'Italy', 'Inglaterra', 'England', 'Belgica', 'Belgium',
  'Holanda', 'Paises Bajos', 'Netherlands', 'Croacia', 'Croatia', 'Uruguay', 'Colombia', 'Chile',
  'Peru', 'Ecuador', 'Paraguay', 'Bolivia', 'Venezuela', 'Costa Rica', 'Panama', 'Jamaica',
  'Canada', 'Estados Unidos', 'USA', 'Japon', 'Japan', 'Corea', 'Korea', 'Australia', 'Marruecos',
  'Morocco', 'Senegal', 'Ghana', 'Nigeria', 'Camerun', 'Cameroon', 'Egipto', 'Egypt',
  'Arabia Saudita', 'Saudi Arabia', 'Qatar', 'Suiza', 'Switzerland', 'Polonia', 'Poland', 'Serbia',
  'Dinamarca', 'Denmark', 'Suecia', 'Sweden', 'Noruega', 'Norway', 'Gales', 'Wales', 'Escocia',
  'Scotland', 'Irlanda', 'Ireland', 'Nueva Zelanda', 'New Zealand', 'Cabo Verde', 'Tunez',
  'Tunisia', 'Argelia', 'Algeria', 'Iran', 'Turquia', 'Turkey', 'Rusia', 'Russia', 'Ucrania',
  'Ukraine', 'Austria', 'Chequia', 'Czech', 'Hungria', 'Hungary', 'Rumania', 'Romania', 'Grecia',
  'Greece', 'Islandia', 'Iceland', 'Finlandia', 'Finland',
];

// Clubes -> liga real que ya existe como categoria en MiJersey.
const LEAGUE_CLUBS = {
  'la-liga': [
    'Real Madrid', 'Barcelona', 'Barca', 'Atletico Madrid', 'Atletico de Madrid', 'Sevilla',
    'Real Sociedad', 'Villarreal', 'Athletic Bilbao', 'Athletic Club', 'Valencia', 'Betis',
    'Real Betis', 'Celta Vigo', 'Osasuna', 'Getafe', 'Espanyol', 'Girona', 'Rayo Vallecano',
    'Mallorca', 'Alaves', 'Las Palmas', 'Leganes', 'Valladolid',
  ],
  'premier-league': [
    'Manchester United', 'Manchester City', 'Arsenal', 'Chelsea', 'Liverpool', 'Tottenham',
    'Newcastle', 'Aston Villa', 'West Ham', 'Everton', 'Leicester', 'Brighton', 'Wolves',
    'Wolverhampton', 'Crystal Palace', 'Fulham', 'Brentford', 'Nottingham', 'Bournemouth',
    'Southampton', 'Burnley', 'Sheffield United', 'Luton',
  ],
  bundesliga: [
    'Bayern Munich', 'Bayern Munchen', 'Bayern', 'Borussia Dortmund', 'Dortmund', 'RB Leipzig',
    'Leipzig', 'Bayer Leverkusen', 'Leverkusen', 'Schalke', 'Werder Bremen', 'Hamburgo',
    'Hamburg', 'Eintracht Frankfurt', 'Frankfurt', 'Wolfsburgo', 'Wolfsburg', 'Stuttgart',
    'Monchengladbach', 'Borussia Monchengladbach', 'Union Berlin', 'Hoffenheim', 'Augsburg',
    'Mainz',
  ],
  'serie-a': [
    'Juventus', 'AC Milan', 'Milan', 'Inter de Milan', 'Inter Milan', 'Napoli', 'AS Roma',
    'Roma', 'Lazio', 'Atalanta', 'Fiorentina', 'Torino', 'Bologna', 'Sampdoria', 'Genoa',
    'Udinese',
  ],
  'ligue-1': [
    'Paris Saint Germain', 'PSG', 'Marsella', 'Marseille', 'Lyon', 'Monaco', 'Lille', 'Nice',
    'Rennes', 'Lens', 'Nantes',
  ],
  eredivisie: ['Ajax', 'PSV', 'Feyenoord', 'AZ Alkmaar'],
  'liga-mx': [
    'America', 'Chivas', 'Guadalajara', 'Cruz Azul', 'Tigres', 'Pumas', 'UNAM', 'Monterrey',
    'Rayados', 'Toluca', 'Santos Laguna', 'Santos', 'Leon', 'Atlas', 'Necaxa', 'Pachuca',
    'Queretaro', 'Puebla', 'Mazatlan', 'Juarez', 'San Luis', 'Atletico San Luis', 'Tijuana',
    'Xolos',
  ],
};

// Clubes reconocidos de ligas que NO tienen categoria propia en el arbol (Brasil, Argentina,
// MLS, etc.) -- van al cajon "Otros" de Retro/Otros en vez de quedar sin categoria.
const OTHER_CLUBS = [
  'Boca Juniors', 'River Plate', 'Flamengo', 'Palmeiras', 'Fluminense', 'Botafogo',
  'Atletico Mineiro', 'Internacional', 'Sao Paulo', 'Corinthians', 'Gremio', 'Vasco da Gama',
  'Inter Miami', 'Los Angeles', 'LA Galaxy', 'LAFC', 'Seattle Sounders',
];

const TARGET_SLUGS = [
  'la-liga', 'serie-a', 'premier-league', 'bundesliga', 'ligue-1', 'eredivisie', 'liga-mx',
  'selecciones', 'retro-otros', 'mundial-2026', 'temporada-26-27',
];

try {
  const categories = await prisma.category.findMany({ where: { slug: { in: TARGET_SLUGS } } });
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c]));
  for (const slug of TARGET_SLUGS) {
    if (!categoryBySlug.has(slug)) fail(`Falta la categoria "${slug}" -- correr create-explore-categories.mjs primero.`);
  }

  const products = await prisma.product.findMany({
    where: { status: 'ACTIVE', visibility: 'PUBLIC', deletedAt: null },
    select: {
      id: true,
      name: true,
      description: true,
      categories: { select: { categoryId: true } },
    },
    orderBy: { name: 'asc' },
  });
  console.log(`Productos activos/publicos a revisar: ${products.length}\n`);

  const clubRegex = {};
  for (const [slug, clubs] of Object.entries(LEAGUE_CLUBS)) {
    clubRegex[slug] = clubs.map((c) => ({ term: c, re: wordBoundaryRegex(c) }));
  }
  const otherClubRegex = OTHER_CLUBS.map((c) => ({ term: c, re: wordBoundaryRegex(c) }));
  const countryRegex = COUNTRY_TEAMS.map((c) => ({ term: c, re: wordBoundaryRegex(c) }));

  const perCategoryCount = new Map(TARGET_SLUGS.map((slug) => [slug, 0]));
  const unmatched = [];
  const toCreate = []; // { productId, categoryId, slug }

  for (const product of products) {
    const normalizedName = normalize(product.name);
    const existingCategoryIds = new Set(product.categories.map((c) => c.categoryId));
    const wantedSlugs = new Set();
    let matched = false;

    for (const [leagueSlug, clubs] of Object.entries(clubRegex)) {
      if (clubs.some(({ re }) => re.test(normalizedName))) {
        wantedSlugs.add(leagueSlug);
        matched = true;
      }
    }

    if (otherClubRegex.some(({ re }) => re.test(normalizedName))) {
      wantedSlugs.add('retro-otros');
      matched = true;
    }

    const isClubWorldCup = /mundial de clubes/i.test(normalizedName);
    if (countryRegex.some(({ re }) => re.test(normalizedName))) {
      wantedSlugs.add('selecciones');
      matched = true;
      if (/mundial/i.test(normalizedName) && !isClubWorldCup) {
        wantedSlugs.add('mundial-2026');
      }
    }

    if (/26\s*\/\s*27/.test(normalizedName)) {
      wantedSlugs.add('temporada-26-27');
    }

    // Señal real (no inventada): el catalogo legacy marca las versiones "Retro" en la propia
    // descripcion del producto cuando aplica.
    if (product.description && /versiones disponibles:[^.]*\bretro\b/i.test(product.description)) {
      wantedSlugs.add('retro-otros');
    }

    if (!matched) {
      unmatched.push(product.name);
      continue;
    }

    for (const slug of wantedSlugs) {
      const category = categoryBySlug.get(slug);
      if (!category) continue;
      perCategoryCount.set(slug, (perCategoryCount.get(slug) ?? 0) + 1);
      if (existingCategoryIds.has(category.id)) continue; // ya la tiene -- idempotente
      toCreate.push({ productId: product.id, categoryId: category.id, slug, name: product.name });
    }
  }

  console.log('Resumen por categoria (productos que matchean, ya sea que falte o no agregarla):');
  for (const slug of TARGET_SLUGS) {
    console.log(`  - ${slug}: ${perCategoryCount.get(slug) ?? 0}`);
  }

  console.log(`\nAsociaciones nuevas a crear: ${toCreate.length}`);
  if (!dryRun) {
    for (const item of toCreate) {
      await prisma.productCategory.create({
        data: { productId: item.productId, categoryId: item.categoryId },
      });
    }
  }

  console.log(
    `\nProductos SIN coincidencia con ningun equipo/pais conocido: ${unmatched.length}`,
  );
  console.log(
    '(Candidatos a revisar manualmente en /admin -- pueden ser "Custom Shirts", "Tee Shirts", ' +
      'o simplemente un equipo que este script no tiene en su diccionario. No se asigna nada ' +
      'automaticamente a esas 2 categorias porque no hay forma confiable de distinguirlas por ' +
      'texto sin arriesgar un error.)',
  );
  if (unmatched.length > 0) {
    console.log('');
    for (const name of unmatched) console.log(`  - ${name}`);
  }

  console.log('');
  console.log(
    dryRun
      ? 'Dry run terminado. No se escribio nada en la base.'
      : 'Listo. Corre tools/populate-explore-banners.mjs de nuevo si quieres que "Explora" ' +
          'recoja las categorias que antes estaban vacias.',
  );
} finally {
  await prisma.$disconnect();
}

function wordBoundaryRegex(term) {
  const escaped = normalize(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`, 'i');
}

function normalize(value) {
  return value
    .normalize('NFD')
    .replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
    .toLowerCase();
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
}

function loadPrismaClient() {
  const apiPackageJson = path.resolve(repoRoot, 'apps/api/package.json');
  const requireFromApi = createRequire(apiPackageJson);
  return requireFromApi('@prisma/client').PrismaClient;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
