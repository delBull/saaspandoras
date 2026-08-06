/**
 * Hermes OS — Content Types
 * 
 * Defines the Universal AST (Abstract Syntax Tree) for Hermes OS.
 * All knowledge (Markdown, PDF, video, audio) is compiled into these nodes.
 */

export type ContentNodeType = 'paragraph' | 'heading' | 'faq' | 'image' | 'video' | 'pdf' | 'quote' | 'table';

export interface ContentNode {
  id: string;
  type: ContentNodeType;
  content: any; // Text for paragraph, URL for image/video, Question/Answer for FAQ
  entities: string[]; // Related entity IDs from the Discovery Graph
  topics: string[];   // Related topic IDs from the Discovery Graph
  relations?: string[]; // IDs of related ContentNodes
  children?: ContentNode[];
  metadata?: Record<string, any>;
}

export interface CompiledContentManifest {
  tenantId: number;
  nodes: ContentNode[];
  checksum: string;
  compiledAt: Date;
}
