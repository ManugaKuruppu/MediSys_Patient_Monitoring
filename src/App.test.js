import { render, screen, within } from '@testing-library/react';
import App from './App';

test('renders app brand in topbar', () => {
  render(<App />);
  const header = screen.getByRole('banner');
  expect(within(header).getByText(/MediSys/i)).toBeInTheDocument();
  expect(within(header).getByText(/Patient Monitor/i)).toBeInTheDocument();
});
