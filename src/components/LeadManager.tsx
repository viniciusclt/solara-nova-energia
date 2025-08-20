import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Plus, Search, Edit, User } from 'lucide-react';
import { Lead } from '@/types';
import { LeadSearchDropdown } from './LeadSearchDropdown';
import LeadForm from './LeadForm';

interface LeadManagerProps {
  onLeadSelect?: (lead: Lead) => void;
  selectedLead?: Lead | null;
  className?: string;
}

export default function LeadManager({ onLeadSelect, selectedLead, className }: LeadManagerProps) {
  const [activeTab, setActiveTab] = useState<'search' | 'form'>('search');
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const handleLeadSelect = (lead: Lead) => {
    setEditingLead(lead);
    onLeadSelect?.(lead);
  };

  const handleEditLead = () => {
    if (selectedLead) {
      setEditingLead(selectedLead);
      setActiveTab('form');
    }
  };

  const handleCreateNew = () => {
    setEditingLead(null);
    setIsCreatingNew(true);
    setActiveTab('form');
  };

  const handleFormSave = (lead: Lead) => {
    setEditingLead(null);
    setIsCreatingNew(false);
    setActiveTab('search');
    onLeadSelect?.(lead);
  };

  const handleFormCancel = () => {
    setEditingLead(null);
    setIsCreatingNew(false);
    setActiveTab('search');
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Tabs para alternar entre busca e formulário */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'search' | 'form')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Buscar Leads
          </TabsTrigger>
          <TabsTrigger value="form" className="flex items-center gap-2">
            {editingLead ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editingLead ? 'Editar Lead' : 'Novo Lead'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          {/* Componente de busca */}
          <LeadSearchDropdown
            onLeadSelect={handleLeadSelect}
            selectedLeadId={selectedLead?.id ?? null}
            placeholder="Digite o nome, email ou CPF do lead..."
            className="w-full"
          />
        </TabsContent>

        <TabsContent value="form" className="space-y-4">
          {/* Formulário de lead */}
          <LeadForm
            lead={editingLead}
            onSave={handleFormSave}
            onCancel={handleFormCancel}
            isCreating={isCreatingNew}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Hook para usar o LeadManager de forma simplificada
export function useLeadManager() {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const openManager = (lead?: Lead) => {
    if (lead) {
      setSelectedLead(lead);
    }
    setIsOpen(true);
  };

  const closeManager = () => {
    setIsOpen(false);
  };

  const selectLead = (lead: Lead) => {
    setSelectedLead(lead);
  };

  return {
    selectedLead,
    isOpen,
    openManager,
    closeManager,
    selectLead,
    setSelectedLead
  };
}