import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ROLES = ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'SUPPORT', 'CUSTOMER'] as const;
type SeedRoleName = (typeof ROLES)[number];

// Conjunto mínimo de permisos de la plataforma. Los módulos de dominio
// (005 en adelante) agregarán los suyos sin necesidad de tocar el guard.
const PERMISSIONS: Array<{ key: string; description: string; roles: SeedRoleName[] }> = [
  {
    key: 'admin:access',
    description: 'Acceder al panel administrativo',
    roles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'SUPPORT'],
  },
  {
    key: 'identity:manage',
    description: 'Gestionar usuarios, roles y permisos',
    roles: ['SUPER_ADMIN', 'ADMIN'],
  },
  {
    key: 'system:configure',
    description: 'Configurar ajustes globales de la plataforma',
    roles: ['SUPER_ADMIN'],
  },
  {
    key: 'catalog:manage',
    description: 'Crear, editar, publicar y archivar productos del catálogo',
    roles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR'],
  },
];

async function seedRoles(): Promise<Map<SeedRoleName, string>> {
  const roleIdByName = new Map<SeedRoleName, string>();

  for (const name of ROLES) {
    const role = await prisma.role.upsert({ where: { name }, update: {}, create: { name } });
    roleIdByName.set(name, role.id);
  }

  return roleIdByName;
}

async function seedPermissions(roleIdByName: Map<SeedRoleName, string>): Promise<void> {
  for (const permission of PERMISSIONS) {
    const record = await prisma.permission.upsert({
      where: { key: permission.key },
      update: { description: permission.description },
      create: { key: permission.key, description: permission.description },
    });

    for (const roleName of permission.roles) {
      const roleId = roleIdByName.get(roleName);
      if (!roleId) continue;

      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId: record.id } },
        update: {},
        create: { roleId, permissionId: record.id },
      });
    }
  }
}

/** Crea un Super Admin solo si se proveen credenciales por variable de entorno. */
async function seedSuperAdmin(roleIdByName: Map<SeedRoleName, string>): Promise<void> {
  const email = process.env.SEED_SUPER_ADMIN_EMAIL;
  const password = process.env.SEED_SUPER_ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn(
      'SEED_SUPER_ADMIN_EMAIL/SEED_SUPER_ADMIN_PASSWORD no definidos: se omite la creación del Super Admin.',
    );
    return;
  }

  const roleId = roleIdByName.get('SUPER_ADMIN');
  if (!roleId) {
    throw new Error('El rol SUPER_ADMIN no existe.');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      roleId,
      emailVerifiedAt: new Date(),
    },
  });
}

async function main(): Promise<void> {
  const roleIdByName = await seedRoles();
  await seedPermissions(roleIdByName);
  await seedSuperAdmin(roleIdByName);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
