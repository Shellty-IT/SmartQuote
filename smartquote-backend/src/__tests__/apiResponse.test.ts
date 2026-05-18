// src/__tests__/apiResponse.test.ts
import { Response } from 'express';
import {
    successResponse,
    errorResponse,
    paginatedResponse,
    ApiSuccessResponse,
    ApiErrorResponse,
} from '../utils/apiResponse';

// Minimal Express Response mock
function mockRes() {
    const res = {
        _status: 0,
        _body: {} as unknown,
        status(code: number) {
            this._status = code;
            return this;
        },
        json(body: unknown) {
            this._body = body;
            return this;
        },
    };
    return res as unknown as Response & { _status: number; _body: unknown };
}

// ── successResponse ──────────────────────────────────────────────────────────

describe('successResponse', () => {
    it('returns 200 with success:true and data', () => {
        const res = mockRes();
        successResponse(res, { id: 1 });
        expect(res._status).toBe(200);
        const body = res._body as ApiSuccessResponse<{ id: number }>;
        expect(body.success).toBe(true);
        expect(body.data).toEqual({ id: 1 });
        expect(body.meta).toBeUndefined();
    });

    it('respects a custom status code', () => {
        const res = mockRes();
        successResponse(res, 'created', 201);
        expect(res._status).toBe(201);
    });

    it('includes meta when provided', () => {
        const res = mockRes();
        successResponse(res, [], 200, { page: 2, limit: 10, total: 50, totalPages: 5 });
        const body = res._body as ApiSuccessResponse<unknown[]>;
        expect(body.meta).toEqual({ page: 2, limit: 10, total: 50, totalPages: 5 });
    });

    it('omits meta when not provided', () => {
        const res = mockRes();
        successResponse(res, null);
        const body = res._body as ApiSuccessResponse<null>;
        expect(Object.prototype.hasOwnProperty.call(body, 'meta')).toBe(false);
    });

    it('works with primitive data', () => {
        const res = mockRes();
        successResponse(res, 42);
        const body = res._body as ApiSuccessResponse<number>;
        expect(body.data).toBe(42);
    });

    it('works with array data', () => {
        const res = mockRes();
        successResponse(res, [1, 2, 3]);
        const body = res._body as ApiSuccessResponse<number[]>;
        expect(body.data).toEqual([1, 2, 3]);
    });

    it('works with null data', () => {
        const res = mockRes();
        successResponse(res, null);
        const body = res._body as ApiSuccessResponse<null>;
        expect(body.data).toBeNull();
    });

    it('includes partial meta (only page and total)', () => {
        const res = mockRes();
        successResponse(res, [], 200, { page: 1, total: 20 });
        const body = res._body as ApiSuccessResponse<unknown[]>;
        expect(body.meta?.page).toBe(1);
        expect(body.meta?.total).toBe(20);
        expect(body.meta?.limit).toBeUndefined();
    });
});

// ── errorResponse ────────────────────────────────────────────────────────────

describe('errorResponse', () => {
    it('returns 400 with success:false and error object', () => {
        const res = mockRes();
        errorResponse(res, 'NOT_FOUND', 'Resource not found', 404);
        expect(res._status).toBe(404);
        const body = res._body as ApiErrorResponse;
        expect(body.success).toBe(false);
        expect(body.error.code).toBe('NOT_FOUND');
        expect(body.error.message).toBe('Resource not found');
    });

    it('defaults to status 400', () => {
        const res = mockRes();
        errorResponse(res, 'BAD_REQUEST', 'Invalid input');
        expect(res._status).toBe(400);
    });

    it('includes details when provided', () => {
        const res = mockRes();
        errorResponse(res, 'VALIDATION_ERROR', 'Validation failed', 422, [{ field: 'email' }]);
        const body = res._body as ApiErrorResponse;
        expect(body.error.details).toEqual([{ field: 'email' }]);
    });

    it('omits details when not provided', () => {
        const res = mockRes();
        errorResponse(res, 'ERR', 'msg');
        const body = res._body as ApiErrorResponse;
        expect(Object.prototype.hasOwnProperty.call(body.error, 'details')).toBe(false);
    });

    it('omits details when explicitly undefined', () => {
        const res = mockRes();
        errorResponse(res, 'ERR', 'msg', 400, undefined);
        const body = res._body as ApiErrorResponse;
        expect(Object.prototype.hasOwnProperty.call(body.error, 'details')).toBe(false);
    });

    it('works with 500 status', () => {
        const res = mockRes();
        errorResponse(res, 'INTERNAL_ERROR', 'Server error', 500);
        expect(res._status).toBe(500);
    });

    it('details can be any type', () => {
        const res = mockRes();
        errorResponse(res, 'ERR', 'msg', 400, 'string detail');
        const body = res._body as ApiErrorResponse;
        expect(body.error.details).toBe('string detail');
    });
});

// ── paginatedResponse ────────────────────────────────────────────────────────

describe('paginatedResponse', () => {
    it('returns 200 with correct meta', () => {
        const res = mockRes();
        paginatedResponse(res, [{ id: 1 }, { id: 2 }], 20, 1, 10);
        expect(res._status).toBe(200);
        const body = res._body as ApiSuccessResponse<{ id: number }[]>;
        expect(body.success).toBe(true);
        expect(body.data).toHaveLength(2);
        expect(body.meta?.page).toBe(1);
        expect(body.meta?.limit).toBe(10);
        expect(body.meta?.total).toBe(20);
        expect(body.meta?.totalPages).toBe(2);
    });

    it('calculates totalPages correctly for non-exact division', () => {
        const res = mockRes();
        paginatedResponse(res, [], 25, 3, 10);
        const body = res._body as ApiSuccessResponse<unknown[]>;
        expect(body.meta?.totalPages).toBe(3); // Math.ceil(25/10)
    });

    it('handles single page', () => {
        const res = mockRes();
        paginatedResponse(res, ['a'], 1, 1, 10);
        const body = res._body as ApiSuccessResponse<string[]>;
        expect(body.meta?.totalPages).toBe(1);
    });

    it('handles empty data with 0 total', () => {
        const res = mockRes();
        paginatedResponse(res, [], 0, 1, 10);
        const body = res._body as ApiSuccessResponse<unknown[]>;
        expect(body.meta?.totalPages).toBe(0);
        expect(body.data).toEqual([]);
    });

    it('handles large dataset', () => {
        const res = mockRes();
        paginatedResponse(res, [], 1000, 5, 20);
        const body = res._body as ApiSuccessResponse<unknown[]>;
        expect(body.meta?.totalPages).toBe(50);
        expect(body.meta?.page).toBe(5);
    });
});
