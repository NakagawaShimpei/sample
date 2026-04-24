import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders login page heading', () => {
  render(<App />);
  const heading = screen.getByText(/WE サンプルアプリ/);
  expect(heading).toBeInTheDocument();
});
