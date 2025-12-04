'use client';

import { use, useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  Bed,
  Bath,
  Car,
  Maximize,
  MapPin,
  Check,
  X,
  Phone,
  Mail,
  Calendar,
  Send,
  Loader2,
  ArrowLeft,
  PawPrint,
  Cigarette,
  Sofa,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/utils';

interface PropertyData {
  property: {
    id: string;
    name: string;
    description: string | null;
    propertyType: string;
    address: string;
    city: string;
    province: string;
    bedrooms: number;
    bathrooms: number;
    size: number | null;
    furnished: boolean;
    parkingSpaces: number;
    amenities: string[];
    rentalType: string;
    monthlyRent: number | null;
    dailyRate: number | null;
    securityDeposit: number | null;
    petsAllowed: boolean;
    smokingAllowed: boolean;
    primaryImageUrl: string | null;
    images: string[];
    user: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string | null;
      companyName: string | null;
    };
  };
  bookedDates: Array<{ start: string; end: string }>;
}

export default function PublicPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  // Inquiry form state
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [inquiryError, setInquiryError] = useState('');

  // Booking form state
  const [bookingSubmitted, setBookingSubmitted] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');

  const { data, isLoading, error } = useQuery<PropertyData>({
    queryKey: ['public-property', id],
    queryFn: async () => {
      const response = await fetch(`/api/public/properties/${id}`);
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to fetch property');
      }
      return response.json();
    },
  });

  // Calculate nights and total price
  const bookingCalculation = useMemo(() => {
    if (!checkInDate || !checkOutDate || !data?.property.dailyRate) {
      return { nights: 0, total: 0 };
    }

    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const diffTime = end.getTime() - start.getTime();
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (nights <= 0) return { nights: 0, total: 0 };

    const total = nights * Number(data.property.dailyRate);
    return { nights, total };
  }, [checkInDate, checkOutDate, data?.property.dailyRate]);

  // Check if selected dates conflict with booked dates
  const hasDateConflict = useMemo(() => {
    if (!checkInDate || !checkOutDate || !data?.bookedDates) return false;

    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);

    return data.bookedDates.some((booking) => {
      const bookedStart = new Date(booking.start);
      const bookedEnd = new Date(booking.end);
      return start < bookedEnd && end > bookedStart;
    });
  }, [checkInDate, checkOutDate, data?.bookedDates]);

  const handleInquirySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setInquiryLoading(true);
    setInquiryError('');

    const formData = new FormData(e.currentTarget);
    const inquiryData = {
      propertyId: id,
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      message: formData.get('message'),
      preferredMoveIn: formData.get('preferredMoveIn'),
      preferredMoveOut: formData.get('preferredMoveOut'),
      numberOfGuests: formData.get('numberOfGuests')
        ? Number(formData.get('numberOfGuests'))
        : undefined,
    };

    try {
      const response = await fetch('/api/public/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inquiryData),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to submit inquiry');
      }

      setInquirySubmitted(true);
    } catch (err) {
      setInquiryError(err instanceof Error ? err.message : 'Failed to submit inquiry');
    } finally {
      setInquiryLoading(false);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBookingLoading(true);
    setBookingError('');

    if (hasDateConflict) {
      setBookingError('Selected dates are not available');
      setBookingLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const bookingData = {
      propertyId: id,
      guestName: formData.get('guestName') as string,
      guestEmail: formData.get('guestEmail') as string,
      guestPhone: formData.get('guestPhone') as string,
      checkInDate: checkInDate,
      checkOutDate: checkOutDate,
      numberOfGuests: Number(formData.get('guests')) || 1,
      specialRequests: (formData.get('notes') as string) || '',
    };

    try {
      const response = await fetch('/api/public/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to submit booking');
      }

      setBookingSubmitted(true);
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'Failed to submit booking');
    } finally {
      setBookingLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <Skeleton className="mb-6 h-8 w-48" />
          <Skeleton className="mb-6 aspect-video w-full rounded-lg" />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <Skeleton className="h-32" />
              <Skeleton className="h-48" />
            </div>
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Building2 className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h2 className="mb-2 text-xl font-semibold">Property Not Found</h2>
            <p className="mb-4 text-gray-500">
              This property is no longer available or doesn't exist.
            </p>
            <Button asChild>
              <Link href="/">Go Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { property } = data;
  const supportsShortTerm = property.rentalType === 'SHORT_TERM' || property.rentalType === 'BOTH';
  const supportsLongTerm = property.rentalType === 'LONG_TERM' || property.rentalType === 'BOTH';
  const showTabs = property.rentalType === 'BOTH';

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  const BookingForm = () => (
    <>
      {bookingSubmitted ? (
        <div className="text-center">
          <Check className="mx-auto mb-4 h-12 w-12 text-green-500" />
          <h3 className="mb-2 font-semibold">Booking Request Sent!</h3>
          <p className="text-sm text-gray-500">
            We've received your booking request and will confirm availability soon.
          </p>
        </div>
      ) : (
        <form onSubmit={handleBookingSubmit} className="space-y-4">
          {bookingError && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20">
              {bookingError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="checkIn">Check-in *</Label>
              <Input
                id="checkIn"
                type="date"
                required
                min={today}
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkOut">Check-out *</Label>
              <Input
                id="checkOut"
                type="date"
                required
                min={checkInDate || today}
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
              />
            </div>
          </div>

          {hasDateConflict && (
            <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-700 dark:bg-yellow-900/20">
              These dates are not available. Please select different dates.
            </div>
          )}

          {bookingCalculation.nights > 0 && !hasDateConflict && (
            <div className="rounded-md bg-blue-50 p-3 dark:bg-blue-900/20">
              <div className="flex items-center justify-between text-sm">
                <span>
                  {bookingCalculation.nights} night{bookingCalculation.nights !== 1 ? 's' : ''} ×{' '}
                  {formatCurrency(Number(property.dailyRate))}
                </span>
                <span className="font-bold">{formatCurrency(bookingCalculation.total)}</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="guests">Number of Guests *</Label>
            <Input
              id="guests"
              name="guests"
              type="number"
              required
              min={1}
              max={10}
              defaultValue={1}
              placeholder="1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="guestName">Full Name *</Label>
            <Input id="guestName" name="guestName" required placeholder="John Doe" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="guestEmail">Email *</Label>
            <Input
              id="guestEmail"
              name="guestEmail"
              type="email"
              required
              placeholder="john@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="guestPhone">Phone *</Label>
            <Input id="guestPhone" name="guestPhone" required placeholder="082 123 4567" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Special Requests</Label>
            <textarea
              id="notes"
              name="notes"
              rows={2}
              className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none"
              placeholder="Any special requests..."
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={bookingLoading || hasDateConflict || bookingCalculation.nights <= 0}
          >
            {bookingLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Calendar className="mr-2 h-4 w-4" />
                Request Booking
              </>
            )}
          </Button>
        </form>
      )}
    </>
  );

  const InquiryForm = () => (
    <>
      {inquirySubmitted ? (
        <div className="text-center">
          <Check className="mx-auto mb-4 h-12 w-12 text-green-500" />
          <h3 className="mb-2 font-semibold">Inquiry Sent!</h3>
          <p className="text-sm text-gray-500">
            We've received your inquiry and will contact you soon.
          </p>
        </div>
      ) : (
        <form onSubmit={handleInquirySubmit} className="space-y-4">
          {inquiryError && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20">
              {inquiryError}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input id="name" name="name" required placeholder="John Doe" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" name="email" type="email" required placeholder="john@example.com" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone *</Label>
            <Input id="phone" name="phone" required placeholder="082 123 4567" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="preferredMoveIn">Preferred Move-in Date</Label>
              <Input id="preferredMoveIn" name="preferredMoveIn" type="date" min={today} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferredMoveOut">Preferred Move-out Date</Label>
              <Input id="preferredMoveOut" name="preferredMoveOut" type="date" min={today} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="numberOfGuests">Number of Guests</Label>
            <Input
              id="numberOfGuests"
              name="numberOfGuests"
              type="number"
              min={1}
              max={10}
              placeholder="1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <textarea
              id="message"
              name="message"
              rows={3}
              className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none"
              placeholder="I'm interested in this property..."
            />
          </div>

          <Button type="submit" className="w-full" disabled={inquiryLoading}>
            {inquiryLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Inquiry
              </>
            )}
          </Button>
        </form>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="border-b bg-white dark:bg-gray-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-blue-600" />
            <span className="text-lg font-semibold">Veld Unity</span>
          </Link>
          <Button variant="outline" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Property Title */}
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <h1 className="text-2xl font-bold md:text-3xl">{property.name}</h1>
            <Badge variant="outline">
              {property.rentalType === 'SHORT_TERM' && 'Short-term'}
              {property.rentalType === 'LONG_TERM' && 'Long-term'}
              {property.rentalType === 'BOTH' && 'Short & Long-term'}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <MapPin className="h-4 w-4" />
            <span>
              {property.address}, {property.city}, {property.province}
            </span>
          </div>
        </div>

        {/* Property Image */}
        <div className="relative mb-6 aspect-video overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700">
          {property.primaryImageUrl ? (
            <Image
              src={property.primaryImageUrl}
              alt={property.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Building2 className="h-16 w-16 text-gray-400" />
            </div>
          )}
          <Badge className="absolute top-4 left-4">{property.propertyType}</Badge>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Quick Stats */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="flex items-center gap-2">
                    <Bed className="h-5 w-5 text-gray-500" />
                    <span>
                      {property.bedrooms} {property.bedrooms === 1 ? 'Bed' : 'Beds'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bath className="h-5 w-5 text-gray-500" />
                    <span>
                      {property.bathrooms} {property.bathrooms === 1 ? 'Bath' : 'Baths'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Car className="h-5 w-5 text-gray-500" />
                    <span>{property.parkingSpaces} Parking</span>
                  </div>
                  {property.size && (
                    <div className="flex items-center gap-2">
                      <Maximize className="h-5 w-5 text-gray-500" />
                      <span>{property.size} m²</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {property.monthlyRent && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Monthly Rent</span>
                    <span className="text-xl font-bold">
                      {formatCurrency(Number(property.monthlyRent))}
                    </span>
                  </div>
                )}
                {property.dailyRate && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Daily Rate</span>
                    <span className="text-xl font-bold">
                      {formatCurrency(Number(property.dailyRate))}
                    </span>
                  </div>
                )}
                {property.securityDeposit && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Security Deposit</span>
                    <span className="font-medium">
                      {formatCurrency(Number(property.securityDeposit))}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Description */}
            {property.description && (
              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-gray-600 dark:text-gray-400">
                    {property.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle>Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <Sofa className="h-4 w-4 text-gray-500" />
                    <span>{property.furnished ? 'Furnished' : 'Unfurnished'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {property.petsAllowed ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                    <PawPrint className="h-4 w-4 text-gray-500" />
                    <span>{property.petsAllowed ? 'Pets Allowed' : 'No Pets'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {property.smokingAllowed ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                    <Cigarette className="h-4 w-4 text-gray-500" />
                    <span>{property.smokingAllowed ? 'Smoking Allowed' : 'No Smoking'}</span>
                  </div>
                </div>

                {property.amenities && property.amenities.length > 0 && (
                  <div className="mt-4">
                    <h4 className="mb-2 font-medium">Amenities</h4>
                    <div className="flex flex-wrap gap-2">
                      {property.amenities.map((amenity) => (
                        <Badge key={amenity} variant="secondary">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Booking/Inquiry Form */}
          <div className="lg:sticky lg:top-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  {supportsShortTerm && !supportsLongTerm && 'Book This Property'}
                  {supportsLongTerm && !supportsShortTerm && 'Interested in this property?'}
                  {showTabs && 'Get in Touch'}
                </CardTitle>
                <CardDescription>
                  {supportsShortTerm && !supportsLongTerm && 'Select your dates and book your stay'}
                  {supportsLongTerm &&
                    !supportsShortTerm &&
                    "Send an inquiry and we'll get back to you shortly"}
                  {showTabs && 'Book a stay or inquire about long-term rental'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {showTabs ? (
                  <Tabs defaultValue="booking" className="w-full">
                    <TabsList className="mb-4 grid w-full grid-cols-2">
                      <TabsTrigger value="booking">Book Stay</TabsTrigger>
                      <TabsTrigger value="inquiry">Inquire</TabsTrigger>
                    </TabsList>
                    <TabsContent value="booking">
                      <BookingForm />
                    </TabsContent>
                    <TabsContent value="inquiry">
                      <InquiryForm />
                    </TabsContent>
                  </Tabs>
                ) : supportsShortTerm ? (
                  <BookingForm />
                ) : (
                  <InquiryForm />
                )}

                {/* Contact Info */}
                {property.user && (
                  <div className="mt-6 border-t pt-4">
                    <h4 className="mb-3 text-sm font-medium">Contact Directly</h4>
                    <div className="space-y-2 text-sm">
                      {property.user.companyName && (
                        <p className="font-medium">{property.user.companyName}</p>
                      )}
                      {property.user.phone && (
                        <a
                          href={`tel:${property.user.phone}`}
                          className="flex items-center gap-2 text-blue-600 hover:underline"
                        >
                          <Phone className="h-4 w-4" />
                          {property.user.phone}
                        </a>
                      )}
                      <a
                        href={`mailto:${property.user.email}`}
                        className="flex items-center gap-2 text-blue-600 hover:underline"
                      >
                        <Mail className="h-4 w-4" />
                        {property.user.email}
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-6 dark:bg-gray-800">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-gray-500">
          <p>Powered by Veld Unity</p>
        </div>
      </footer>
    </div>
  );
}
