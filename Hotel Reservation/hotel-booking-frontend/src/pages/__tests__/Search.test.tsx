import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { MemoryRouter } from 'react-router-dom';
import Search from '../Search';
import * as apiClient from '../../api-client';
import { HotelSearchResponse } from '../../../../shared/types';
import { SearchContextProvider } from '../../contexts/SearchContext';

// Mock the api-client
vi.mock('../../api-client');

const mockedSearchHotels = vi.mocked(apiClient.searchHotels);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('Search Page', () => {

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  it('should render search results when API call is successful', async () => {
    const mockHotelData: HotelSearchResponse = {
      data: [
        {
          _id: '1',
          userId: 'user1',
          name: 'Test Hotel Dublin',
          city: 'Dublin',
          country: 'Ireland',
          description: 'A fantastic test hotel',
          type: ['Budget'],
          facilities: ['WiFi', 'Parking'],
          starRating: 4,
          imageUrls: ['url1.jpg', 'url2.jpg'],
          lastUpdated: new Date(),
          isFeatured: false,
          roomTypes: [
            {
              _id: 'rt1',
              hotelId: '1',
              name: 'Standard Room',
              description: 'A standard room',
              adultCount: 2,
              childCount: 1,
              pricePerNight: 100,
              amenities: ['WiFi'],
              imageUrls: [],
            }
          ],
        },
      ],
      pagination: {
        total: 1,
        page: 1,
        pages: 1,
      },
    };

    mockedSearchHotels.mockResolvedValue(mockHotelData);

    render(
      <QueryClientProvider client={queryClient}>
        <SearchContextProvider>
            <MemoryRouter initialEntries={['/search?destination=Dublin']}>
                <Search />
            </MemoryRouter>
        </SearchContextProvider>
      </QueryClientProvider>
    );

    // Wait for the hotel name to appear in the document
    const hotelName = await screen.findByText('Test Hotel Dublin');
    expect(hotelName).toBeInTheDocument();

    // Check if the api was called with the correct params
    expect(mockedSearchHotels).toHaveBeenCalledWith(expect.objectContaining({
        destination: 'Dublin'
    }));
  });

  it('should display a message when no hotels are found', async () => {
    const mockHotelData: HotelSearchResponse = {
      data: [],
      pagination: {
        total: 0,
        page: 1,
        pages: 1,
      },
    };

    mockedSearchHotels.mockResolvedValue(mockHotelData);

    render(
      <QueryClientProvider client={queryClient}>
        <SearchContextProvider>
            <MemoryRouter initialEntries={['/search?destination=Nowhere']}>
                <Search />
            </MemoryRouter>
        </SearchContextProvider>
      </QueryClientProvider>
    );

    // Check that the "No Hotels found" message is displayed
    const noHotelsMessage = await screen.findByText('0 Hotels found');
    expect(noHotelsMessage).toBeInTheDocument();
  });
});
