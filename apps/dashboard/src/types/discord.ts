
export interface SchedulerWebhookPayload {
    username: string;
    avatar_url?: string;
    content?: string;
    embeds?: DiscordEmbed[];
}

export interface DiscordEmbed {
    title?: string;
    description?: string;
    url?: string;
    color?: number;
    timestamp?: string;
    footer?: {
        text: string;
        icon_url?: string;
    };
    thumbnail?: {
        url: string;
    };
    image?: {
        url: string;
    };
    author?: {
        name: string;
        url?: string;
        icon_url?: string;
    };
    fields?: DiscordEmbedField[];
}

export interface DiscordEmbedField {
    name: string;
    value: string;
    inline?: boolean;
}
