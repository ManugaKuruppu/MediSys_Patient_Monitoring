// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Provide a minimal canvas mock so libs that probe for it don't crash
Object.defineProperty(window.HTMLCanvasElement.prototype, 'getContext', {
	value: jest.fn(() => ({})),
});

// Mock chart components to avoid Chart.js accessing canvas in JSDOM
jest.mock('react-chartjs-2', () => {
	const React = require('react');
	const Mock = (props) => React.createElement('div', props, props.children);
	return {
		Chart: Mock,
		Line: Mock,
		Bar: Mock,
		Doughnut: Mock,
		Pie: Mock,
		PolarArea: Mock,
		Radar: Mock,
		Bubble: Mock,
		Scatter: Mock,
	};
});
