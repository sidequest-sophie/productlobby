import { Metadata } from 'next';
import { Building2, ExternalLink, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Brand Directory',
  description: 'Explore brands on ProductLobby',
};

interface Brand {
  id: string;
  name: string;
  handle: string;
  avatar: string | null;
  category: string;
  campaignCount: number;
}

async function getBrands(search?: string) {
  try {
    const params = new URLSearchParams();
    if (search) {
      params.set('search', search);
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/brands/directory?${params}`,
      {
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch brands');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching brands:', error);
    // Return sample data on error
    return [
      {
        id: '1',
        name: 'TechVision',
        handle: 'techvision',
        avatar: null,
        category: 'Technology',
        campaignCount: 5,
      },
      {
        id: '2',
        name: 'StyleHub',
        handle: 'stylehub',
        avatar: null,
        category: 'Fashion',
        campaignCount: 3,
      },
      {
        id: '3',
        name: 'EcoGoods',
        handle: 'ecogoods',
        avatar: null,
        category: 'Sustainability',
        campaignCount: 7,
      },
      {
        id: '4',
        name: 'FoodFresh',
        handle: 'foodfresh',
        avatar: null,
        category: 'Food & Beverage',
        campaignCount: 4,
      },
    ];
  }
}

export default async function BrandDirectoryPage() {
  const brands = await getBrands();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="rounded-lg bg-violet-100 p-3">
              <Building2 className="h-8 w-8 text-violet-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-slate-900">Brand Directory</h1>
          <p className="mt-2 text-lg text-slate-600">
            Discover brands and creators on ProductLobby
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Search Bar */}
        <div className="mb-8 flex items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search brands..."
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
        </div>

        {/* Brands Grid */}
        {brands.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {brands.map((brand: Brand) => (
              <div
                key={brand.id}
                className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-violet-300"
              >
                {/* Logo Placeholder */}
                <div className="mb-4 flex h-24 items-center justify-center rounded-lg bg-gradient-to-br from-violet-50 to-slate-100">
                  {brand.avatar ? (
                    <img
                      src={brand.avatar}
                      alt={brand.name}
                      className="h-full w-full rounded-lg object-cover"
                    />
                  ) : (
                    <Building2 className="h-8 w-8 text-violet-400" />
                  )}
                </div>

                {/* Brand Info */}
                <h3 className="text-lg font-semibold text-slate-900">
                  {brand.name}
                </h3>
                <p className="mt-1 text-sm text-slate-500">@{brand.handle}</p>

                {/* Category and Campaign Count */}
                <div className="mt-4 flex items-center gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Category</p>
                    <p className="font-medium text-slate-900">{brand.category}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Campaigns</p>
                    <p className="font-medium text-lime-600">
                      {brand.campaignCount}
                    </p>
                  </div>
                </div>

                {/* View Profile Link */}
                <div className="mt-6">
                  <Link href={`/brands/${brand.handle}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-violet-200 text-violet-600 hover:bg-violet-50 hover:border-violet-300"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Profile
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-4 text-lg font-semibold text-slate-900">
              No brands found
            </h3>
            <p className="mt-2 text-slate-600">
              Check back soon for brands joining ProductLobby
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
