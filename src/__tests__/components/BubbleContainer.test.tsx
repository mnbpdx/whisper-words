import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import BubbleContainer from '../../app/components/BubbleContainer';

describe('BubbleContainer', () => {
  test('should render with correct styling', () => {
    const { container } = render(
      <BubbleContainer />
    );
    
    const bubbleContainer = container.firstChild;
    expect(bubbleContainer).toHaveClass('w-full');
    expect(bubbleContainer).toHaveClass('bg-gray-100');
    expect(bubbleContainer).toHaveClass('rounded-lg');
    expect(bubbleContainer).toHaveClass('shadow-inner');
    expect(bubbleContainer).toHaveClass('min-h-[400px]');
  });
  
  test('should render child elements', () => {
    render(
      <BubbleContainer>
        <div data-testid="test-child">Test Child</div>
      </BubbleContainer>
    );
    
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByText('Test Child')).toBeInTheDocument();
  });
  
  test('should render multiple children with appropriate layout', () => {
    render(
      <BubbleContainer>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
        <div data-testid="child-3">Child 3</div>
      </BubbleContainer>
    );
    
    // Check that all children are rendered
    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
    expect(screen.getByTestId('child-3')).toBeInTheDocument();
    
    // Check that the inner container has the flex-wrap class
    const innerContainer = screen.getByTestId('child-1').parentElement;
    expect(innerContainer).toHaveClass('flex');
    expect(innerContainer).toHaveClass('flex-wrap');
    expect(innerContainer).toHaveClass('gap-2');
    expect(innerContainer).toHaveClass('justify-center');
  });
  
  test('should render empty when no children are provided', () => {
    const { container } = render(
      <BubbleContainer />
    );
    
    // Container should still be rendered
    expect(container.firstChild).toBeInTheDocument();
    
    // The inner flex container should be empty but present
    const innerContainer = container.firstChild?.firstChild;
    expect(innerContainer).toBeInTheDocument();
    expect(innerContainer?.childNodes.length).toBe(0);
  });
}); 