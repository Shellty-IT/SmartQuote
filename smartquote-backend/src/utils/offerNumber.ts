import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';

export async function generateOfferNumber(userId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `OFF/${year}/`;

    // Use SQL MAX with numeric cast to avoid lexicographic ordering bugs
    // (e.g. '999' > '1000' alphabetically breaks the string-sort approach)
    const result = await prisma.$queryRaw<[{ max_num: bigint | null }]>(
        Prisma.sql`
            SELECT MAX(CAST(SUBSTRING("number", ${prefix.length + 1}) AS INTEGER)) AS max_num
            FROM "offers"
            WHERE "userId" = ${userId}
            AND "number" LIKE ${prefix + '%'}
        `,
    );

    const maxNum = result[0]?.max_num != null ? Number(result[0].max_num) : 0;
    const nextNumber = maxNum + 1;
    return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
}
