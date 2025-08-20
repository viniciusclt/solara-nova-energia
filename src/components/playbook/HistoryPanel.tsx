import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPlaybookService } from '@/services/PlaybookService';
import { PlaybookHistoryEntry } from '@/types/playbook';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { History as HistoryIcon, RefreshCcw, Download } from 'lucide-react';

interface HistoryPanelProps {
  playbookId: string;
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString();
  } catch {
    return dateStr;
  }
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ playbookId }) => {
  const playbookService = getPlaybookService();

  const { data: history = [], isLoading, refetch } = useQuery<PlaybookHistoryEntry[]>({
    queryKey: ['playbook-history', playbookId],
    queryFn: () => playbookService.getHistory(playbookId),
    enabled: !!playbookId,
    staleTime: 1000 * 60 * 10,
  });

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HistoryIcon className="h-4 w-4" />
          <h3 className="font-medium">Histórico</h3>
          <Badge variant="secondary">{history.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <Separator />
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {isLoading && (
            <div className="text-sm text-muted-foreground">Carregando histórico...</div>
          )}

          {!isLoading && history.length === 0 && (
            <div className="text-sm text-muted-foreground">Nenhuma versão registrada ainda.</div>
          )}

          {history.map((entry) => (
            <Card key={entry.id} className="p-3">
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={entry.createdBy.avatar} />
                  <AvatarFallback>{entry.createdBy.name?.slice(0,2)?.toUpperCase() || 'US'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate">
                      <div className="font-medium truncate">v{entry.version} • {entry.title}</div>
                      <div className="text-xs text-muted-foreground truncate">{formatDate(entry.createdAt)} • {entry.createdBy.name}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{entry.changes.length} alterações</Badge>
                      <Button variant="ghost" size="icon" title="Baixar snapshot" onClick={() => {
                        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(entry.snapshot, null, 2));
                        const anchor = document.createElement('a');
                        anchor.setAttribute('href', dataStr);
                        anchor.setAttribute('download', `playbook_${playbookId}_v${entry.version}.json`);
                        anchor.click();
                      }}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {entry.description && (
                    <div className="text-sm mt-1">{entry.description}</div>
                  )}
                  <ul className="mt-2 space-y-1">
                    {entry.changes.slice(0, 4).map((c, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground">
                        • {c.description}
                      </li>
                    ))}
                    {entry.changes.length > 4 && (
                      <li className="text-xs text-muted-foreground">+{entry.changes.length - 4} outras alterações</li>
                    )}
                  </ul>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default HistoryPanel;