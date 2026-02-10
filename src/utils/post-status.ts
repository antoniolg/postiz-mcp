export type PostPublicationStatus = 'draft' | 'scheduled' | 'now';
export type PostizApiPostType = 'draft' | 'schedule' | 'now';

export function toPostizApiType(status: PostPublicationStatus | undefined): PostizApiPostType {
    if (status === 'scheduled') {
        return 'schedule';
    }

    if (status === 'now') {
        return 'now';
    }

    return 'draft';
}

export function resolvePostDate(type: PostizApiPostType, scheduledDate?: string): string | undefined {
    if (type === 'schedule') {
        return scheduledDate;
    }

    if (type === 'now') {
        return new Date().toISOString();
    }

    return undefined;
}
