import Booking from './booking';

describe('Booking Model', () => {
  it('should have the correct model name', () => {
    expect(Booking.modelName).toBe('Booking');
  });
});
