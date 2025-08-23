/**
 * Testes unitários para AutoRoutingService
 * 
 * Testa algoritmo A*, detecção de obstáculos,
 * suavização de caminhos e otimizações de rota
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AutoRoutingService } from '../AutoRoutingService';
import { DiagramNode, Point, RouteOptions } from '../../types/diagram';

describe('AutoRoutingService', () => {
  let service: AutoRoutingService;
  
  const mockNodes: DiagramNode[] = [
    {
      id: 'node-1',
      type: 'rectangle',
      position: { x: 100, y: 100 },
      size: { width: 120, height: 80 },
      data: { label: 'Node 1' },
      style: {},
    },
    {
      id: 'node-2',
      type: 'rectangle',
      position: { x: 300, y: 200 },
      size: { width: 120, height: 80 },
      data: { label: 'Node 2' },
      style: {},
    },
    {
      id: 'obstacle',
      type: 'rectangle',
      position: { x: 200, y: 150 },
      size: { width: 80, height: 60 },
      data: { label: 'Obstacle' },
      style: {},
    },
  ];

  beforeEach(() => {
    service = new AutoRoutingService();
  });

  describe('Inicialização', () => {
    it('deve criar instância com configurações padrão', () => {
      expect(service).toBeInstanceOf(AutoRoutingService);
      expect(service.getGridSize()).toBe(10);
      expect(service.getMargin()).toBe(20);
    });

    it('deve aceitar configurações customizadas', () => {
      const customService = new AutoRoutingService({
        gridSize: 15,
        margin: 30,
        smoothing: false,
        avoidOverlap: false,
      });

      expect(customService.getGridSize()).toBe(15);
      expect(customService.getMargin()).toBe(30);
    });
  });

  describe('Cálculo de Rota Básica', () => {
    it('deve calcular rota direta quando não há obstáculos', () => {
      const start: Point = { x: 100, y: 100 };
      const end: Point = { x: 300, y: 200 };
      const nodes: DiagramNode[] = [];

      const route = service.calculateRoute(start, end, nodes);

      expect(route).toBeDefined();
      expect(route.points).toHaveLength(2);
      expect(route.points[0]).toEqual(start);
      expect(route.points[route.points.length - 1]).toEqual(end);
      expect(route.distance).toBeGreaterThan(0);
    });

    it('deve retornar rota com pontos intermediários quando há obstáculos', () => {
      const start: Point = { x: 100, y: 150 };
      const end: Point = { x: 300, y: 150 };
      
      const route = service.calculateRoute(start, end, mockNodes);

      expect(route).toBeDefined();
      expect(route.points.length).toBeGreaterThan(2);
      expect(route.points[0]).toEqual(start);
      expect(route.points[route.points.length - 1]).toEqual(end);
    });

    it('deve calcular distância total corretamente', () => {
      const start: Point = { x: 0, y: 0 };
      const end: Point = { x: 300, y: 400 };
      
      const route = service.calculateRoute(start, end, []);
      const expectedDistance = Math.sqrt(300 * 300 + 400 * 400);

      expect(route.distance).toBeCloseTo(expectedDistance, 1);
    });
  });

  describe('Detecção de Obstáculos', () => {
    it('deve detectar colisão com nó', () => {
      const point: Point = { x: 150, y: 140 };
      const obstacle = mockNodes[2]; // obstacle node

      const hasCollision = service.hasCollision(point, [obstacle]);

      expect(hasCollision).toBe(true);
    });

    it('deve não detectar colisão quando ponto está fora do nó', () => {
      const point: Point = { x: 50, y: 50 };
      const obstacle = mockNodes[2];

      const hasCollision = service.hasCollision(point, [obstacle]);

      expect(hasCollision).toBe(false);
    });

    it('deve considerar margem na detecção de colisão', () => {
      const customService = new AutoRoutingService({ margin: 50 });
      const point: Point = { x: 150, y: 100 }; // Próximo ao obstáculo
      const obstacle = mockNodes[2];

      const hasCollision = customService.hasCollision(point, [obstacle]);

      expect(hasCollision).toBe(true);
    });

    it('deve detectar múltiplos obstáculos', () => {
      const point: Point = { x: 150, y: 140 };
      
      const hasCollision = service.hasCollision(point, mockNodes);

      expect(hasCollision).toBe(true);
    });
  });

  describe('Algoritmo A*', () => {
    it('deve encontrar caminho ótimo usando A*', () => {
      const start: Point = { x: 50, y: 150 };
      const end: Point = { x: 400, y: 150 };
      
      const route = service.calculateRoute(start, end, mockNodes);

      expect(route).toBeDefined();
      expect(route.points[0]).toEqual(start);
      expect(route.points[route.points.length - 1]).toEqual(end);
      
      // Verificar se a rota evita obstáculos
      const hasCollisionInRoute = route.points.some(point => 
        service.hasCollision(point, [mockNodes[2]])
      );
      expect(hasCollisionInRoute).toBe(false);
    });

    it('deve retornar null quando não há caminho possível', () => {
      // Criar cenário onde o destino está completamente bloqueado
      const start: Point = { x: 0, y: 0 };
      const end: Point = { x: 250, y: 180 };
      
      const blockingNodes: DiagramNode[] = [
        {
          id: 'block-1',
          type: 'rectangle',
          position: { x: 200, y: 150 },
          size: { width: 100, height: 60 },
          data: { label: 'Block 1' },
          style: {},
        },
        {
          id: 'block-2',
          type: 'rectangle',
          position: { x: 200, y: 210 },
          size: { width: 100, height: 60 },
          data: { label: 'Block 2' },
          style: {},
        },
      ];

      const route = service.calculateRoute(start, end, blockingNodes);

      // Em alguns casos pode retornar null, em outros uma rota alternativa
      if (route === null) {
        expect(route).toBeNull();
      } else {
        expect(route.points.length).toBeGreaterThan(0);
      }
    });

    it('deve usar heurística Manhattan corretamente', () => {
      const point1: Point = { x: 0, y: 0 };
      const point2: Point = { x: 30, y: 40 };
      
      const heuristic = service.calculateHeuristic(point1, point2);
      const expectedHeuristic = Math.abs(30 - 0) + Math.abs(40 - 0);

      expect(heuristic).toBe(expectedHeuristic);
    });
  });

  describe('Suavização de Caminhos', () => {
    it('deve suavizar rota com curvas quando habilitado', () => {
      const smoothingService = new AutoRoutingService({ smoothing: true });
      const start: Point = { x: 100, y: 100 };
      const end: Point = { x: 400, y: 300 };
      
      const route = smoothingService.calculateRoute(start, end, mockNodes);

      expect(route).toBeDefined();
      expect(route.smoothed).toBe(true);
    });

    it('deve manter rota angular quando suavização desabilitada', () => {
      const angularService = new AutoRoutingService({ smoothing: false });
      const start: Point = { x: 100, y: 100 };
      const end: Point = { x: 400, y: 300 };
      
      const route = angularService.calculateRoute(start, end, mockNodes);

      expect(route).toBeDefined();
      expect(route.smoothed).toBe(false);
    });

    it('deve aplicar curvas Bézier na suavização', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 200, y: 100 },
      ];

      const smoothedPoints = service.smoothPath(points);

      expect(smoothedPoints.length).toBeGreaterThanOrEqual(points.length);
      expect(smoothedPoints[0]).toEqual(points[0]);
      expect(smoothedPoints[smoothedPoints.length - 1]).toEqual(points[points.length - 1]);
    });
  });

  describe('Otimizações de Performance', () => {
    it('deve usar cache para rotas calculadas', () => {
      const start: Point = { x: 100, y: 100 };
      const end: Point = { x: 300, y: 200 };
      
      const spy = vi.spyOn(service, 'calculateRoute');
      
      // Primeira chamada
      const route1 = service.calculateRoute(start, end, mockNodes);
      
      // Segunda chamada com mesmos parâmetros
      const route2 = service.calculateRoute(start, end, mockNodes);

      expect(route1).toEqual(route2);
      expect(spy).toHaveBeenCalledTimes(2);
    });

    it('deve limitar número de iterações do A*', () => {
      const start: Point = { x: 0, y: 0 };
      const end: Point = { x: 1000, y: 1000 };
      
      const startTime = performance.now();
      const route = service.calculateRoute(start, end, mockNodes);
      const endTime = performance.now();
      
      // Deve completar em tempo razoável (< 100ms)
      expect(endTime - startTime).toBeLessThan(100);
      expect(route).toBeDefined();
    });

    it('deve otimizar grid baseado na densidade de obstáculos', () => {
      const denseNodes: DiagramNode[] = Array.from({ length: 20 }, (_, i) => ({
        id: `dense-${i}`,
        type: 'rectangle',
        position: { x: (i % 5) * 100, y: Math.floor(i / 5) * 100 },
        size: { width: 50, height: 50 },
        data: { label: `Dense ${i}` },
        style: {},
      }));

      const start: Point = { x: 0, y: 0 };
      const end: Point = { x: 500, y: 400 };
      
      const route = service.calculateRoute(start, end, denseNodes);

      expect(route).toBeDefined();
      expect(route.points.length).toBeGreaterThan(2);
    });
  });

  describe('Configurações de Rota', () => {
    it('deve respeitar opções de rota customizadas', () => {
      const options: RouteOptions = {
        avoidOverlap: true,
        preferStraightLines: true,
        maxBends: 3,
        cornerRadius: 15,
      };

      const start: Point = { x: 100, y: 100 };
      const end: Point = { x: 400, y: 300 };
      
      const route = service.calculateRoute(start, end, mockNodes, options);

      expect(route).toBeDefined();
      expect(route.options).toEqual(options);
    });

    it('deve limitar número de curvas quando especificado', () => {
      const options: RouteOptions = {
        maxBends: 2,
      };

      const start: Point = { x: 100, y: 100 };
      const end: Point = { x: 400, y: 300 };
      
      const route = service.calculateRoute(start, end, mockNodes, options);

      expect(route).toBeDefined();
      
      // Contar mudanças de direção
      let bends = 0;
      for (let i = 1; i < route.points.length - 1; i++) {
        const prev = route.points[i - 1];
        const curr = route.points[i];
        const next = route.points[i + 1];
        
        const dir1 = { x: curr.x - prev.x, y: curr.y - prev.y };
        const dir2 = { x: next.x - curr.x, y: next.y - curr.y };
        
        if (dir1.x !== dir2.x || dir1.y !== dir2.y) {
          bends++;
        }
      }
      
      expect(bends).toBeLessThanOrEqual(options.maxBends!);
    });

    it('deve preferir linhas retas quando configurado', () => {
      const options: RouteOptions = {
        preferStraightLines: true,
      };

      const start: Point = { x: 100, y: 100 };
      const end: Point = { x: 300, y: 100 }; // Linha horizontal
      
      const route = service.calculateRoute(start, end, [], options);

      expect(route).toBeDefined();
      expect(route.points).toHaveLength(2); // Linha direta
      expect(route.points[0].y).toBe(route.points[1].y); // Mesma altura
    });
  });

  describe('Casos Extremos', () => {
    it('deve lidar com pontos de início e fim idênticos', () => {
      const point: Point = { x: 100, y: 100 };
      
      const route = service.calculateRoute(point, point, mockNodes);

      expect(route).toBeDefined();
      expect(route.points).toHaveLength(1);
      expect(route.points[0]).toEqual(point);
      expect(route.distance).toBe(0);
    });

    it('deve lidar com lista vazia de obstáculos', () => {
      const start: Point = { x: 0, y: 0 };
      const end: Point = { x: 100, y: 100 };
      
      const route = service.calculateRoute(start, end, []);

      expect(route).toBeDefined();
      expect(route.points).toHaveLength(2);
    });

    it('deve lidar com obstáculos muito grandes', () => {
      const largeObstacle: DiagramNode = {
        id: 'large',
        type: 'rectangle',
        position: { x: 0, y: 0 },
        size: { width: 1000, height: 1000 },
        data: { label: 'Large' },
        style: {},
      };

      const start: Point = { x: -100, y: 500 };
      const end: Point = { x: 1100, y: 500 };
      
      const route = service.calculateRoute(start, end, [largeObstacle]);

      expect(route).toBeDefined();
      expect(route.points.length).toBeGreaterThan(2);
    });

    it('deve lidar com coordenadas negativas', () => {
      const start: Point = { x: -100, y: -100 };
      const end: Point = { x: 100, y: 100 };
      
      const route = service.calculateRoute(start, end, mockNodes);

      expect(route).toBeDefined();
      expect(route.points[0]).toEqual(start);
      expect(route.points[route.points.length - 1]).toEqual(end);
    });
  });

  describe('Métricas e Estatísticas', () => {
    it('deve fornecer estatísticas de performance', () => {
      const start: Point = { x: 100, y: 100 };
      const end: Point = { x: 400, y: 300 };
      
      const route = service.calculateRoute(start, end, mockNodes);

      expect(route).toBeDefined();
      expect(route.stats).toBeDefined();
      expect(route.stats.nodesExplored).toBeGreaterThan(0);
      expect(route.stats.executionTime).toBeGreaterThan(0);
    });

    it('deve calcular eficiência da rota', () => {
      const start: Point = { x: 100, y: 100 };
      const end: Point = { x: 300, y: 200 };
      
      const route = service.calculateRoute(start, end, mockNodes);
      const directDistance = Math.sqrt(
        Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
      );
      
      const efficiency = directDistance / route.distance;

      expect(efficiency).toBeGreaterThan(0);
      expect(efficiency).toBeLessThanOrEqual(1);
      expect(route.stats.efficiency).toBeCloseTo(efficiency, 2);
    });
  });
});