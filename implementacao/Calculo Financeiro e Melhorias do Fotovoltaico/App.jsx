import React from 'react';
import DimensionadorAquecimento from './components/DimensionadorAquecimento';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Gerador de Propostas - Aquecimento Solar
          </h1>
          <p className="text-gray-600 mt-1">
            Sistema completo para dimensionamento e geração de propostas
          </p>
        </div>
      </header>
      
      <main>
        <DimensionadorAquecimento />
      </main>
      
      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2025 Gerador de Propostas - Aquecimento Solar. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
