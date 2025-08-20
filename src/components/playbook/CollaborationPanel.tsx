import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Users, UserPlus, Trash2, Shield } from 'lucide-react';

// Tipos mínimos para integrar com o hook usePlaybookCollaboration
export type CollaborationRole = 'owner' | 'editor' | 'commenter' | 'viewer';

export interface CollaborationPanelProps {
  playbookId: string;
  collaborators: Array<{
    id: string;
    name: string;
    email?: string | null;
    avatar?: string | null;
    role: CollaborationRole | string;
    addedAt?: string | null;
  }>;
  onAddCollaborator: (params: { userId: string; role: CollaborationRole | string }) => void;
  onRemoveCollaborator: (userId: string) => void;
  onUpdateRole: (params: { userId: string; role: CollaborationRole | string }) => void;
  isLoading?: boolean;
}

const roleLabels: Record<string, string> = {
  owner: 'Proprietário',
  editor: 'Editor',
  commenter: 'Comentarista',
  viewer: 'Leitor'
};

const changeableRoles: CollaborationRole[] = ['editor', 'commenter', 'viewer'];

export const CollaborationPanel: React.FC<CollaborationPanelProps> = ({
  collaborators,
  onAddCollaborator,
  onRemoveCollaborator,
  onUpdateRole,
  isLoading
}) => {
  const [newUserId, setNewUserId] = useState('');
  const [newRole, setNewRole] = useState<CollaborationRole>('viewer');

  const sortedCollaborators = useMemo(() => {
    // Proprietário primeiro, depois editors, commenters, viewers
    const weight = (role: string) => ({ owner: 0, editor: 1, commenter: 2, viewer: 3 }[role as string] ?? 99);
    return [...collaborators].sort((a, b) => weight(a.role) - weight(b.role));
  }, [collaborators]);

  const handleAdd = () => {
    if (!newUserId.trim()) return;
    onAddCollaborator({ userId: newUserId.trim(), role: newRole });
    setNewUserId('');
    setNewRole('viewer');
  };

  return (
    <Card className="h-full rounded-none border-0">
      <CardHeader className="px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Colaboração</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Adicionar colaborador */}
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">Adicionar colaborador (ID do usuário)</div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="ID do usuário"
              value={newUserId}
              onChange={(e) => setNewUserId(e.target.value)}
            />
            <Select value={newRole} onValueChange={(v) => setNewRole(v as CollaborationRole)}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Permissão" />
              </SelectTrigger>
              <SelectContent>
                {changeableRoles.map((r) => (
                  <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAdd} disabled={isLoading || !newUserId.trim()}>
              <UserPlus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </div>

        <Separator />

        {/* Lista de colaboradores */}
        <div className="space-y-3">
          {sortedCollaborators.map((c) => {
            const isOwner = c.role === 'owner';
            const initials = (c.name || c.email || 'U')
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();
            return (
              <div key={c.id} className="flex items-center justify-between gap-2 p-2 rounded-md bg-background">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    {c.avatar ? <AvatarImage src={c.avatar} alt={c.name || c.email || 'Usuário'} /> : null}
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-medium leading-tight">{c.name || c.email || c.id}</div>
                    <div className="text-xs text-muted-foreground">{c.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isOwner ? (
                    <Badge variant="secondary" className="gap-1">
                      <Shield className="h-3.5 w-3.5" /> {roleLabels[c.role] ?? c.role}
                    </Badge>
                  ) : (
                    <Select value={String(c.role)} onValueChange={(role) => onUpdateRole({ userId: c.id, role })}>
                      <SelectTrigger className="w-40 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {changeableRoles.map((r) => (
                          <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    onClick={() => onRemoveCollaborator(c.id)}
                    disabled={isOwner || isLoading}
                    title={isOwner ? 'O proprietário não pode ser removido' : 'Remover colaborador'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}

          {sortedCollaborators.length === 0 && (
            <div className="text-sm text-muted-foreground">Nenhum colaborador adicionado ainda.</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CollaborationPanel;