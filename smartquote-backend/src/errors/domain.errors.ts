// src/errors/domain.errors.ts

export class DomainError extends Error {
    constructor(
        public readonly code: string,
        message: string,
        public readonly statusCode: number = 400,
    ) {
        super(message);
        this.name = 'DomainError';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class NotFoundError extends DomainError {
    constructor(resource: string) {
        super('NOT_FOUND', `${resource} nie znaleziony/a`, 404);
        this.name = 'NotFoundError';
    }
}

export class ValidationError extends DomainError {
    constructor(message: string) {
        super('VALIDATION_ERROR', message, 400);
        this.name = 'ValidationError';
    }
}

export class ConflictError extends DomainError {
    constructor(message: string) {
        super('CONFLICT', message, 409);
        this.name = 'ConflictError';
    }
}

export class UnauthorizedError extends DomainError {
    constructor(message = 'Brak autoryzacji') {
        super('UNAUTHORIZED', message, 401);
        this.name = 'UnauthorizedError';
    }
}

export class UnsupportedMediaTypeError extends DomainError {
    constructor(message = 'Nieobsługiwany format danych') {
        super('UNSUPPORTED_MEDIA_TYPE', message, 415);
        this.name = 'UnsupportedMediaTypeError';
    }
}

export class ExternalServiceError extends DomainError {
    /** Original message from the external API — logged but never sent to the client. */
    readonly internalMessage?: string;

    constructor(service: string, publicMessage: string, internalMessage?: string) {
        super(`${service}_ERROR`, publicMessage, 502);
        this.name = 'ExternalServiceError';
        this.internalMessage = internalMessage;
    }
}
