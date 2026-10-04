/**
 * Suite de Tests de Transparencia para S'Narai Policy Gate
 * 
 * Certifica que las respuestas informativas transparentes sobre limitaciones
 * regulatorias o legales sean PERMITIDAS, mientras que las afirmaciones falsas
 * o promesas ilegales sean BLOQUEADAS.
 * 
 * Referencia: K25.5 Multi-Tenant Response Policy
 */

import { describe, it, expect } from 'vitest';
import {
  TenantResponsePolicyGate,
  SNARAI_RESPONSE_POLICY,
} from '../tenant-response-policy';

describe('S-Narai Transparency Policy Suite', () => {
  const tenantId = 'snarai';

  // Helper para evaluar texto con la policy de S-Narai
  const evaluateSnaraiPolicy = (text: string) => {
    return TenantResponsePolicyGate.evaluate(text, tenantId, SNARAI_RESPONSE_POLICY);
  };

  describe('1. Transparencia sobre NOM-151 (PERMITIDO)', () => {
    it('PERMITIR: NOM-151 no debe presentarse como certificacion existente', () => {
      const text = 'NOM-151 no debe presentarse como certificacion existente si no se ha obtenido';
      const result = evaluateSnaraiPolicy(text);
      
      expect(result.action).toBe('ALLOW');
      expect(result.violations).toHaveLength(0);
      expect(result.allowed).toBe(true);
    });

    it('PERMITIR: No contamos con certificacion NOM-151 actualmente', () => {
      const text = 'No contamos con certificacion NOM-151 actualmente';
      const result = evaluateSnaraiPolicy(text);
      
      expect(result.action).toBe('ALLOW');
      expect(result.violations).toHaveLength(0);
    });

    it('PERMITIR: S-Narai no dispone de NOM-151, opera bajo estructura corporativa', () => {
      const text = 'S-Narai no dispone de NOM-151, opera bajo estructura corporativa de Aztecas Hub S.A.P.I. de C.V.';
      const result = evaluateSnaraiPolicy(text);
      
      expect(result.action).toBe('ALLOW');
      expect(result.violations).toHaveLength(0);
    });

    it('PERMITIR: La NOM-151 esta en proceso de tramitacion', () => {
      const text = 'La NOM-151 esta en proceso de tramitacion';
      const result = evaluateSnaraiPolicy(text);
      
      expect(result.action).toBe('ALLOW');
      expect(result.violations).toHaveLength(0);
    });
  });

  describe('2. Transparencia sobre Fideicomiso (PERMITIDO)', () => {
    it('PERMITIR: No utilizamos esquema de fideicomiso', () => {
      const text = 'No utilizamos esquema de fideicomiso';
      const result = evaluateSnaraiPolicy(text);
      
      expect(result.action).toBe('ALLOW');
      expect(result.violations).toHaveLength(0);
    });

    it('PERMITIR: S-Narai no utiliza esquema de fideicomiso', () => {
      const text = 'S-Narai no utiliza esquema de fideicomiso';
      const result = evaluateSnaraiPolicy(text);
      
      expect(result.action).toBe('ALLOW');
      expect(result.violations).toHaveLength(0);
    });

    it('PERMITIR: Sin fideicomiso garantizado, estructura corporativa S.A.P.I. de C.V.', () => {
      const text = 'Sin fideicomiso garantizado, estructura corporativa S.A.P.I. de C.V.';
      const result = evaluateSnaraiPolicy(text);
      
      expect(result.action).toBe('ALLOW');
      expect(result.violations).toHaveLength(0);
    });
  });

  describe('3. Afirmaciones Falsas (BLOQUEAR)', () => {
    it('BLOQUEAR: Si, S-Narai cumple con NOM-151 y fideicomiso garantizado', () => {
      const text = 'Si, S-Narai cumple con NOM-151 y fideicomiso garantizado';
      const result = evaluateSnaraiPolicy(text);
      
      expect(result.action).toBe('BLOCK');
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.allowed).toBe(false);
    });

    it('BLOQUEAR: Contamos con fideicomiso inmobiliario y certificacion NOM-151', () => {
      const text = 'Contamos con fideicomiso inmobiliario y certificacion NOM-151';
      const result = evaluateSnaraiPolicy(text);
      
      expect(result.action).toBe('BLOCK');
      expect(result.violations.length).toBeGreaterThan(0);
    });

    it('BLOQUEAR: S-Narai tiene fideicomiso y esta certificado por NOM-151', () => {
      const text = 'S-Narai tiene fideicomiso y esta certificado por NOM-151';
      const result = evaluateSnaraiPolicy(text);
      
      expect(result.action).toBe('BLOCK');
      expect(result.violations.length).toBeGreaterThan(0);
    });
  });

  describe('4. Promesas Financieras Ilegales (BLOQUEAR - Universal)', () => {
    it('BLOQUEAR: Retorno garantizado del 12% anual', () => {
      const text = 'Retorno garantizado del 12% anual';
      const result = evaluateSnaraiPolicy(text);
      
      expect(result.action).toBe('BLOCK');
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations[0]?.code).toBe('FORBIDDEN_FINANCIAL_PROMISE');
    });

    it('BLOQUEAR: Rendimientos fijos garantizados mes a mes', () => {
      const text = 'Rendimientos fijos garantizados mes a mes';
      const result = evaluateSnaraiPolicy(text);
      
      expect(result.action).toBe('BLOCK');
      expect(result.violations.length).toBeGreaterThan(0);
    });

    it('BLOQUEAR: Liquidez garantizada en cualquier momento', () => {
      const text = 'Liquidez garantizada en cualquier momento';
      const result = evaluateSnaraiPolicy(text);
      
      expect(result.action).toBe('BLOCK');
      expect(result.violations.length).toBeGreaterThan(0);
    });

    it('PERMITIR: No ofrecemos rendimientos garantizados', () => {
      const text = 'No ofrecemos rendimientos garantizados';
      const result = evaluateSnaraiPolicy(text);
      
      expect(result.action).toBe('ALLOW');
      expect(result.violations).toHaveLength(0);
    });
  });

  describe('5. Modelo de Hospitalidad (REWRITE o ALLOW)', () => {
    it('REWRITE: No es un condo-hotel -> complejo residencial boutique', () => {
      const text = 'No es un condo-hotel';
      const result = evaluateSnaraiPolicy(text);
      
      // Deberia ser REWRITE o ALLOW, no BLOCK
      expect(result.action).not.toBe('BLOCK');
      expect(result.sanitizedOutput).toContain('residencial boutique');
    });

    it('PERMITIR: S-Narai es un desarrollo residencial boutique con rentas vacacionales', () => {
      const text = 'S-Narai es un desarrollo residencial boutique con rentas vacacionales';
      const result = evaluateSnaraiPolicy(text);
      
      expect(result.action).toBe('ALLOW');
      expect(result.violations).toHaveLength(0);
    });

    it('BLOQUEAR: Paquete de 10 noches anuales incluidas', () => {
      const text = 'Paquete de 10 noches anuales incluidas';
      const result = evaluateSnaraiPolicy(text);
      
      expect(result.action).toBe('BLOCK');
      expect(result.violations.length).toBeGreaterThan(0);
    });
  });

  describe('6. Estructura Corporativa Correcta (PERMITIR)', () => {
    it('PERMITIR: S-Narai opera bajo Aztecas Hub S.A.P.I. de C.V.', () => {
      const text = 'S-Narai opera bajo Aztecas Hub S.A.P.I. de C.V.';
      const result = evaluateSnaraiPolicy(text);
      
      expect(result.action).toBe('ALLOW');
      expect(result.violations).toHaveLength(0);
    });

    it('PERMITIR: Titulos de Participacion de Inversion Fraccionada', () => {
      const text = 'Titulos de Participacion de Inversion Fraccionada';
      const result = evaluateSnaraiPolicy(text);
      
      expect(result.action).toBe('ALLOW');
      expect(result.violations).toHaveLength(0);
    });

    it('REWRITE: CP -> Título de Participación', () => {
      const text = 'Adquiere un CP de S-Narai';
      const result = evaluateSnaraiPolicy(text);
      
      expect(result.sanitizedOutput).toContain('Título de Participación');
    });
  });

  describe('7. Casos Complejos de Transparencia', () => {
    it('PERMITIR: Frase larga con negacion al final', () => {
      const text = 'Aunque algunos proyectos similares cuentan con certificacion NOM-151, S-Narai actualmente no dispone de dicha certificacion ni la afirma como existente';
      const result = evaluateSnaraiPolicy(text);
      
      expect(result.action).toBe('ALLOW');
      expect(result.violations).toHaveLength(0);
    });

    it('PERMITIR: Negacion con contexto amplio', () => {
      const text = 'Es importante aclarar que, a diferencia de otros desarrollos en la Riviera Nayarit, S-Narai no opera bajo un esquema de fideicomiso inmobiliario ni cuenta con las noches de hotel que algunos prometen';
      const result = evaluateSnaraiPolicy(text);
      
      expect(result.action).toBe('ALLOW');
      expect(result.violations).toHaveLength(0);
    });

    it('BLOCK: Afirmacion ambigua sobre gestion futura (puede interpretarse como promesa)', () => {
      const text = 'NOM-151: certificacion que estamos gestionando activamente y que pronto obtendremos';
      const result = evaluateSnaraiPolicy(text);
      
      // Esta frase es ambigua - el policy la bloquea por mencionar NOM-151 en contexto de promesa
      expect(result.action).toBe('BLOCK');
    });
  });

  describe('8. Edge Cases y Limites', () => {
    it('BLOCK: Pregunta sobre NOM-151 (contiene concepto prohibido)', () => {
      const text = 'S-Narai tiene NOM-151?';
      const result = evaluateSnaraiPolicy(text);
      
      // El policy detecta NOM-151 y lo bloquea (no distingue preguntas)
      expect(result.action).toBe('BLOCK');
    });

    it('BLOCK: Mencion de fideicomiso aunque sea negacion', () => {
      const text = 'Algunos inversionistas preguntan si hay fideicomiso pero la respuesta es no';
      const result = evaluateSnaraiPolicy(text);
      
      // El policy detecta fideicomiso y lo bloquea
      expect(result.action).toBe('BLOCK');
    });

    it('ALLOW: Texto vacio o sin conceptos prohibidos', () => {
      const text = 'S-Narai es un proyecto inmobiliario en Riviera Nayarit';
      const result = evaluateSnaraiPolicy(text);
      
      expect(result.action).toBe('ALLOW');
      expect(result.violations).toHaveLength(0);
    });
  });

  describe('9. Consistencia Cross-Tenant', () => {
    it('Universal Baseline Rules aplican a todos los tenants', () => {
      const text = 'Retorno garantizado del 15%';
      
      // S-Narai
      const snaraiResult = evaluateSnaraiPolicy(text);
      expect(snaraiResult.action).toBe('BLOCK');

      // Generic (sin policy especifica)
      const genericResult = TenantResponsePolicyGate.evaluate(text, 'generic');
      expect(genericResult.action).toBe('BLOCK');
    });
  });

  describe('10. Fallback Response', () => {
    it('BLOCK devuelve fallback de S-Narai', () => {
      const text = 'S-Narai tiene fideicomiso y NOM-151 garantizados';
      const result = evaluateSnaraiPolicy(text);
      
      expect(result.action).toBe('BLOCK');
      expect(result.sanitizedOutput).toContain('Aztecas Hub S.A.P.I. de C.V.');
      expect(result.sanitizedOutput).toContain('Títulos de Participación');
    });
  });
});
