import { render, screen, fireEvent } from '@testing-library/react';
import StadiumMap from './StadiumMap';
import { trackEvent } from '../../lib/analytics';

// Mock analytics
jest.mock('../../lib/analytics', () => ({
  trackEvent: jest.fn(),
  TelemetryEvents: {
    MAP_NODE_SELECT: 'map_node_select',
    ROUTE_CALCULATED: 'route_calculated',
  }
}));


// Mock window.open for Google Maps link
const mockOpen = jest.fn();
window.open = mockOpen;

describe('StadiumMap Component', () => {
  it('renders stats and map canvas', () => {
    render(<StadiumMap />);
    expect(screen.getByText(/Venue Load/i)).toBeInTheDocument();
    expect(screen.getByText(/Live Incident Feed/i)).toBeInTheDocument();
  });

  it('selects a node and triggers analytics', async () => {
    const { container } = render(<StadiumMap />);
    
    // Use clear selector for SVG groups with specific labels
    const node = container.querySelector('g[aria-label*="Sec 110"]');
    if (!node) throw new Error('Node not found');
    fireEvent.click(node);

    expect(trackEvent).toHaveBeenCalledWith('map_node_select', expect.any(Object));
  });

  it('opens Google Maps when link is clicked in details', async () => {
    const { container } = render(<StadiumMap />);
    
    // Select a node to open details
    const node = container.querySelector('g[aria-label*="Sec 110"]');
    if (!node) throw new Error('Node not found');
    fireEvent.click(node);




    // Find and click Google Maps button
    const mapBtn = screen.getByText(/Locate via Google Maps/i);
    fireEvent.click(mapBtn);

    expect(mockOpen).toHaveBeenCalledWith(expect.stringContaining('google.com/maps'), '_blank');
  });

  it('filters incidents when chip is clicked', () => {
    render(<StadiumMap />);
    const criticalChip = screen.getByRole('button', { name: /CRITICAL/i });
    fireEvent.click(criticalChip);

    
    // Check if filter applied (implementation detail check or check incident list changes)
    expect(criticalChip).toHaveClass('filterChipActive');
  });
});
