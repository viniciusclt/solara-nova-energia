# Flowchart da Experiência do Usuário (UX) - Solara Nova Energia (Rebuild)

Este documento contém o flowchart em sintaxe Mermaid que representa a jornada do usuário através da plataforma Solara Nova Energia. O diagrama ilustra os principais fluxos de interação, desde a autenticação até a utilização dos módulos específicos.

## Diagrama Mermaid

```mermaid
graph TD
    subgraph "Fluxo de Autenticação"
        A[Início] --> B{Usuário Logado?};
        B -- Não --> C[Página de Login/Registro];
        C --> D[Autenticação via Clerk];
        D -- Sucesso --> E[Dashboard Principal];
        D -- Falha --> C;
        B -- Sim --> E;
    end

    subgraph "Dashboard e Navegação Principal"
        E --> F[Sidebar de Navegação];
        F --> G[Clientes];
        F --> H[Treinamentos];
        F --> I[Roadmap];
        F --> J[Configurações];
    end

    subgraph "Fluxo de Clientes e Vendas (Core)"
        G --> G1[Lista de Clientes];
        G1 --> G2{Ação do Usuário};
        G2 -- "Novo Cliente" --> G3[Formulário de Cadastro de Cliente];
        G3 -- "Salvar" --> G1;
        G2 -- "Visualizar Cliente" --> G4[Detalhes do Cliente];
        
        G4 --> G5[Lista de Oportunidades do Cliente];
        G5 --> G6{Ação na Oportunidade};
        G6 -- "Nova Oportunidade" --> G7[Formulário de Cadastro de Oportunidade];
        G7 -- "Salvar" --> G5;
        G6 -- "Visualizar Oportunidade" --> G8[Detalhes da Oportunidade];

        G8 --> G9[Dados da Simulação Solar/Aquecimento/Wallbox];
        G8 --> G10[Lista de Propostas da Oportunidade];
        G10 --> G11{Ação na Proposta};
        G11 -- "Nova Proposta" --> G12[Editor Visual de Propostas];
        G12 -- "Salvar" --> G10;
        G11 -- "Visualizar Proposta" --> G13[Visualização da Proposta Gerada];
        G13 --> G14[Compartilhar URL];
        G13 --> G15[Exportar para PDF];
    end

    subgraph "Fluxo do Módulo de Treinamento"
        H --> H1[Catálogo de Módulos de Treinamento];
        H1 --> H2{Seleciona Módulo};
        H2 --> H3[Lista de Conteúdos do Módulo];
        H3 --> H4{Seleciona Conteúdo};
        H4 -- "Vídeo" --> H5[Player de Vídeo Protegido];
        H4 -- "Playbook" --> H6[Leitor de Playbook];
        H4 -- "Diagrama" --> H7[Visualizador de Diagrama];
        H4 -- "Avaliação" --> H8[Interface de Avaliação/Questionário];
        H8 -- "Finalizar" --> H9[Resultado e Geração de Certificado];
        
        subgraph "Admin de Treinamento (Gerente/Super Admin)"
            J --> H10[Painel de Gestão de Treinamentos];
            H10 --> H11[CRUD de Módulos];
            H10 --> H12[CRUD de Conteúdos];
            H12 --> H13[Upload de Vídeo para MinIO];
            H12 --> H14[Editor de Playbooks];
            H12 --> H15[Editor de Diagramas];
            H12 --> H16[Criador de Avaliações];
        end
    end

    subgraph "Outros Módulos"
        I --> I1[Visualização do Roadmap];
        I1 --> I2[Votar em Itens];
        J --> J1[Configurações de Perfil];
        J --> J2[Configurações do Sistema (Admin)];
    end

    E --> G;
    E --> H;
    E --> I;
    E --> J;
```

## Descrição do Fluxo

1.  **Autenticação**: O usuário começa na página de login/registro. Após a autenticação bem-sucedida via Clerk, ele é redirecionado para o Dashboard Principal.
2.  **Navegação Principal**: A partir do Dashboard, o usuário pode navegar para as seções principais da aplicação através da barra lateral: Clientes, Treinamentos, Roadmap e Configurações.
3.  **Fluxo de Clientes e Vendas**: Este é o fluxo central da aplicação.
    *   O usuário acessa a lista de clientes.
    *   Ele pode adicionar um novo cliente ou visualizar um existente.
    *   Ao visualizar um cliente, ele vê as oportunidades de negócio associadas.
    *   Ele pode criar uma nova oportunidade (Fotovoltaico, Aquecimento, etc.) ou visualizar uma existente.
    *   Dentro de uma oportunidade, ele pode ver os dados da simulação e a lista de propostas.
    *   A partir daqui, ele pode criar uma nova proposta no editor visual, que será salva e associada àquela oportunidade.
    *   Uma proposta gerada pode ser visualizada, compartilhada via URL segura ou exportada para PDF.
4.  **Fluxo de Treinamento**: 
    *   O usuário acessa o catálogo de módulos de treinamento.
    *   Ele seleciona um módulo e vê a lista de conteúdos (vídeos, playbooks, etc.).
    *   Ele consome o conteúdo e, se for uma avaliação, pode obter um certificado ao final.
    *   Usuários com permissão (Gerente/Super Admin) têm acesso a um painel de gestão para criar e editar módulos e conteúdos.
5.  **Outros Módulos**: O usuário pode visualizar o roadmap de desenvolvimento do produto e gerenciar suas configurações de perfil. Admins têm acesso a configurações globais do sistema.

Este flowchart fornece uma visão geral da arquitetura da experiência do usuário, servindo como um guia para o desenvolvimento da navegação e da interação entre os diferentes módulos do sistema. Estou pronto para a sua validação final.

