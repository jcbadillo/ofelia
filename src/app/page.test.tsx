import { render, screen } from '@testing-library/react';
import HomePage from './page';

describe('HomePage', () => {
  it('renders the hello heading', () => {
    render(<HomePage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Hello, Ofelia' })).toBeInTheDocument();
  });
});
