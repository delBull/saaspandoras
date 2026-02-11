declare module 'qrcode' {
    export interface QRCodeToDataURLOptions {
        version?: number;
        errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
        margin?: number;
        scale?: number;
        width?: number;
        color?: {
            dark?: string;
            light?: string;
        };
        type?: 'image/png' | 'image/jpeg' | 'image/webp';
        rendererOpts?: {
            quality?: number;
        };
    }

    export function toDataURL(
        text: string,
        options?: QRCodeToDataURLOptions
    ): Promise<string>;

    export function toDataURL(
        text: string,
        callback: (error: Error | null | undefined, url: string) => void
    ): void;

    export function toDataURL(
        text: string,
        options: QRCodeToDataURLOptions,
        callback: (error: Error | null | undefined, url: string) => void
    ): void;
}
