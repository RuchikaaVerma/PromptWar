import '@testing-library/jest-dom'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import Home from './page'

// Mock analytics
jest.mock('../lib/analytics', () => ({
  trackEvent: jest.fn(),
  TelemetryEvents: {
    TAB_SWITCH: 'tab_switch',
    AI_CHAT_MSG: 'ai_chat_message',
    SAFETY_ALERT_ACK: 'safety_alert_acknowledged',
  }
}));

// Mock child components
jest.mock('./components/StadiumMap', () => function MockMap() { return <div data-testid="stadium-map">Stadium Map</div>; });
jest.mock('./components/FoodOrdering', () => function MockFood() { return <div data-testid="food-ordering">Food Ordering</div>; });


describe('Home Navigation Tests', () => {
  it('renders overview by default', () => {
    render(<Home />)
    expect(screen.getByText('Queue Prediction (XGBoost)')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /SVES Overview/i })).toHaveAttribute('aria-selected', 'true')
  })

  it('switches to map tab and renders StadiumMap', () => {
    render(<Home />)
    const mapTab = screen.getByRole('tab', { name: /Navigation/i })
    fireEvent.click(mapTab)
    expect(mapTab).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('stadium-map')).toBeInTheDocument()
  })

  it('switches to food tab and renders FoodOrdering', () => {
    render(<Home />)
    const foodTab = screen.getByRole('tab', { name: /POS Terminal/i })
    fireEvent.click(foodTab)
    expect(foodTab).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('food-ordering')).toBeInTheDocument()
  })

  it('switches to tickets tab and shows access context', () => {
    render(<Home />)
    fireEvent.click(screen.getByRole('tab', { name: /Identity Core/i }))
    expect(screen.getByText('Access Identity Context')).toBeInTheDocument()
    expect(screen.getByText('Championship Series')).toBeInTheDocument()
  })

  it('switches to AI assistant tab and interacts with chat', async () => {

    render(<Home />)
    fireEvent.click(screen.getByRole('tab', { name: /AI Assistant/i }))
    
    // Check initial prompt
    expect(screen.getByText(/Hello! I am your SVES LLM Assistant/i)).toBeInTheDocument()
    
    const input = screen.getByPlaceholderText(/Where is the nearest empty washroom/i)
    const sendButton = screen.getByRole('button', { name: /Send message/i })
    
    // Type user msg
    fireEvent.change(input, { target: { value: 'where is the food' } })
    fireEvent.click(sendButton)
    
    // Check if user msg exists
    await waitFor(() => expect(screen.getByText('where is the food')).toBeInTheDocument());
    // Check if AI response about food exists
    await waitFor(() => expect(screen.getByText(/Express Bar \(Sec 115\) is your safest bet for food/i)).toBeInTheDocument());
  })

  
  it('handles safety alert acknowledge correctly', () => {
    render(<Home />)
    
    // Default dashboard expected
    const alertBtn = screen.getByRole('button', { name: /Acknowledge anomaly and deploy smart alert/i })
    fireEvent.click(alertBtn)
    
    // Check text change
    expect(screen.getByText('Optimization Executed ✅')).toBeInTheDocument()
    expect(screen.getByText(/Load distribution adjusted/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Acknowledge anomaly and deploy smart alert/i })).not.toBeInTheDocument()
  })
})
