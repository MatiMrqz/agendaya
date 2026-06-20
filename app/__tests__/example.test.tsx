import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// A simple dummy component to test
function Welcome() {
  return <h1>Welcome to Agenda Ya!</h1>;
}

describe('Welcome Component', () => {
  it('renders the welcome message', () => {
    render(<Welcome />);
    expect(screen.getByText('Welcome to Agenda Ya!')).toBeInTheDocument();
  });
});
