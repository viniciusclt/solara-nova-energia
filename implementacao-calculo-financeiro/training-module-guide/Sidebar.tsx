            </span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={close}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
            aria-label="Fechar sidebar"
          >
            <X size={16} />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {/* Módulos Principais */}
          <SidebarSection title="Módulos">
            <SidebarItem
              icon={Home}
              label="Fotovoltaico"
              module="solar"
            />
            <SidebarItem
              icon={Droplets}
              label="Aquecimento Banho"
              module="heating-bath"
            />
            <SidebarItem
              icon={Waves}
              label="Aquecimento Piscina"
              module="heating-pool"
            />
            <SidebarItem
              icon={Zap}
              label="WallBox"
              module="wallbox"
            />
          </SidebarSection>
          
          {/* Espaçamento */}
          <div className="my-4" />
          
          {/* Seção Secundária */}
          <SidebarSection>
            <SidebarItem
              icon={GraduationCap}
              label="Treinamentos"
              module="training"
            />
          </SidebarSection>
        </nav>

        {/* Footer - Utilitários */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-2 mt-auto">
          <SidebarSection>
            <SidebarItem
              icon={HelpCircle}
              label="Ajuda"
              onClick={onHelpClick}
            />
            <div className="w-full px-2 py-1">
              <SettingsModal />
            </div>
            <SidebarItem
              icon={LogOut}
              label="Sair"
              onClick={handleLogout}
              className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            />