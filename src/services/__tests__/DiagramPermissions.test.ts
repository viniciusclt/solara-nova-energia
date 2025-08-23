import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { getDiagramService, setDiagramServiceType } from '../DiagramServiceFactory';
import { db, runMigrations, schema } from '../../db';
import { diagrams, diagramCollaborators, diagramRevisions } from '../../db/schema';
import { eq } from 'drizzle-orm';

const service = () => {
  // Garantir uso do Drizzle nas suítes de teste
  setDiagramServiceType('drizzle');
  return getDiagramService();
};

async function cleanupDb() {
  // Limpar tabelas em ordem segura (FK)
  await db.delete(diagramCollaborators);
  await db.delete(diagramRevisions);
  await db.delete(diagrams);
}

async function ensureProfile(id: string, email?: string, name?: string) {
  const [existing] = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.id, id))
    .limit(1);

  if (!existing) {
    await db.insert(schema.profiles).values({
      id,
      email: email || `${id}@test.dev`,
      name: name || id,
      // access_type possui default 'vendedor' no schema
    });
  }
}

function baseContent() {
  return {
    nodes: [],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 },
  };
}

describe('Diagram Permissions (Drizzle adapter)', () => {
  beforeAll(async () => {
    await runMigrations();
  });

  beforeEach(async () => {
    await cleanupDb();
  });

  it('owner deve ter permissão de edição', async () => {
    const svc = service();
    const ownerId = 'user-owner-1';

    await ensureProfile(ownerId);

    const d = await svc.createDiagram({
      title: 'Diag 1',
      type: 'flowchart',
      content: baseContent(),
      ownerId,
      isPublic: false,
      isTemplate: false,
    });

    const perm = await svc.getUserPermission(d.id, ownerId);
    expect(perm).toBe('owner');

    const can = await svc.canEdit(d.id, ownerId);
    expect(can).toBe(true);
  });

  it('editor deve conseguir editar', async () => {
    const svc = service();
    const ownerId = 'user-owner-2';
    const editorId = 'user-editor-2';

    await ensureProfile(ownerId);
    await ensureProfile(editorId);

    const d = await svc.createDiagram({
      title: 'Diag 2',
      type: 'flowchart',
      content: baseContent(),
      ownerId,
      isPublic: false,
      isTemplate: false,
    });

    const ok = await svc.setPermission(d.id, editorId, 'editor');
    expect(ok).toBe(true);

    const perm = await svc.getUserPermission(d.id, editorId);
    expect(perm).toBe('editor');

    const can = await svc.canEdit(d.id, editorId);
    expect(can).toBe(true);
  });

  it('viewer não deve conseguir editar', async () => {
    const svc = service();
    const ownerId = 'user-owner-3';
    const viewerId = 'user-viewer-3';

    await ensureProfile(ownerId);
    await ensureProfile(viewerId);

    const d = await svc.createDiagram({
      title: 'Diag 3',
      type: 'flowchart',
      content: baseContent(),
      ownerId,
      isPublic: false,
      isTemplate: false,
    });

    const ok = await svc.setPermission(d.id, viewerId, 'viewer');
    expect(ok).toBe(true);

    const perm = await svc.getUserPermission(d.id, viewerId);
    expect(perm).toBe('viewer');

    const can = await svc.canEdit(d.id, viewerId);
    expect(can).toBe(false);
  });

  it('transferência de ownership deve atualizar owner e revogar edição do antigo owner', async () => {
    const svc = service();
    const oldOwner = 'user-owner-4';
    const newOwner = 'user-owner-4b';

    await ensureProfile(oldOwner);
    await ensureProfile(newOwner);

    const d = await svc.createDiagram({
      title: 'Diag 4',
      type: 'flowchart',
      content: baseContent(),
      ownerId: oldOwner,
      isPublic: false,
      isTemplate: false,
    });

    const ok = await svc.setPermission(d.id, newOwner, 'owner');
    expect(ok).toBe(true);

    const updated = await svc.getDiagram(d.id);
    expect(updated?.ownerId).toBe(newOwner);

    const oldPerm = await svc.getUserPermission(d.id, oldOwner);
    expect(oldPerm).toBeNull();

    const canOld = await svc.canEdit(d.id, oldOwner);
    expect(canOld).toBe(false);

    const newPerm = await svc.getUserPermission(d.id, newOwner);
    expect(newPerm).toBe('owner');
  });
});