import { PublicProjectStateDTO } from "./dto";

/**
 * Pandora's Growth OS - B2C Public API Client
 * 
 * Strict boundary client. This class must ONLY use standard Fetch API to communicate
 * with the Business Operating Plane (dash.pandoras.finance). 
 * No database connections or internal backend imports are allowed here.
 */
export class PublicApiClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_PANDORAS_API_URL || "http://localhost:3000/api/v1";
    this.apiKey = process.env.NEXT_PUBLIC_PANDORAS_PUBLIC_KEY || "";
    
    if (!this.apiKey && process.env.NODE_ENV === "production") {
      console.warn("⚠️ NEXT_PUBLIC_PANDORAS_PUBLIC_KEY is missing. API calls will fail in production.");
    }
  }

  /**
   * Fetches the public state of a project.
   * If a wallet is provided, it returns personalized progression, balances and certificates.
   */
  async getProjectState(slug: string, walletAddress?: string): Promise<PublicProjectStateDTO> {
    const url = new URL(`${this.baseUrl}/public/project/${slug}/state`);
    if (walletAddress) {
      url.searchParams.append("wallet", walletAddress);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "x-api-key": this.apiKey,
        "Content-Type": "application/json"
      },
      // Using Next.js 15 cache semantics (ISR compatible)
      next: { revalidate: 60 }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch project state for ${slug}. Status: ${response.status}. ${errorText}`);
    }

    return response.json() as Promise<PublicProjectStateDTO>;
  }
}

// Export singleton instance for client and server components
export const apiClient = new PublicApiClient();
