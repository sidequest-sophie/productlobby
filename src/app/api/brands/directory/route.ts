export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';

    // Fetch brands with claimed profiles
    const brands = await prisma.brand.findMany({
      where: {
        AND: [
          {
            OR: [{ status: 'CLAIMED' }, { status: 'VERIFIED' }],
          },
          search
            ? {
                OR: [
                  { name: { contains: search, mode: 'insensitive' } },
                  { slug: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {},
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        _count: {
          select: {
            campaigns: true,
          },
        },
      },
      take: 100,
    });

    // Format the response
    const brandDirectory = brands.map((brand) => ({
      id: brand.id,
      name: brand.name,
      handle: brand.slug,
      avatar: brand.logo,
      category: 'General',
      campaignCount: brand._count.campaigns,
    }));

    return NextResponse.json(brandDirectory);
  } catch (error) {
    console.error('Error fetching brand directory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brands' },
      { status: 500 }
    );
  }
}
